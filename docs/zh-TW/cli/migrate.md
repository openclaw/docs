---
read_when:
    - 您想要從 Hermes 或其他代理系統遷移到 OpenClaw
    - 你正在新增一個由 Plugin 擁有的遷移提供者
summary: '`openclaw migrate` 的 CLI 參考（從另一個代理系統匯入狀態）'
title: 遷移
x-i18n:
    generated_at: "2026-05-12T23:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
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
  已註冊遷移提供者的名稱，例如 `hermes`。執行 `openclaw migrate list` 查看已安裝的提供者。
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
  當計畫回報衝突時，允許套用動作取代現有目標。
</ParamField>
<ParamField path="--yes" type="boolean">
  略過確認提示。在非互動模式中為必填。
</ParamField>
<ParamField path="--skill <name>" type="string">
  依技能名稱或項目 ID 選取一個技能複製項目。重複此旗標可遷移多個技能。省略時，互動式 Codex 遷移會顯示核取方塊選擇器，非互動式遷移則保留所有已規劃技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  依 Plugin 名稱或項目 ID 選取一個 Codex Plugin 安裝項目。重複此旗標可遷移多個 Codex Plugin。省略時，互動式 Codex 遷移會顯示原生 Codex Plugin 核取方塊選擇器，非互動式遷移則保留所有已規劃 Plugin。這只適用於 Codex 應用程式伺服器清單探索到、來源端已安裝的 `openai-curated` Codex Plugin。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  僅 Codex。規劃原生 Plugin 啟用前，強制重新遍歷來源 Codex 應用程式伺服器的 `app/list`。預設為關閉，以維持遷移規劃快速。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  略過套用前備份。當本機 OpenClaw 狀態存在時，需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  當套用動作原本會拒絕略過備份時，需與 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印計畫或套用結果。使用 `--json` 且沒有 `--yes` 時，套用會列印計畫且不變更狀態。
</ParamField>

## 安全模型

`openclaw migrate` 以預覽優先。

<AccordionGroup>
  <Accordion title="套用前預覽">
    提供者會在任何變更發生前回傳逐項列出的計畫，包括衝突、略過項目和敏感項目。JSON 計畫、套用輸出和遷移報告會遮蔽巢狀、看起來像機密的金鑰，例如 API 金鑰、權杖、授權標頭、Cookie 和密碼。

    `openclaw migrate apply <provider>` 會預覽計畫，並在變更狀態前提示，除非已設定 `--yes`。在非互動模式中，套用需要 `--yes`。

  </Accordion>
  <Accordion title="備份">
    套用會在遷移前建立並驗證 OpenClaw 備份。如果尚不存在本機 OpenClaw 狀態，會略過備份步驟並繼續遷移。若要在狀態存在時略過備份，請同時傳入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="衝突">
    當計畫有衝突時，套用會拒絕繼續。請檢閱計畫；如果取代現有目標是有意為之，請使用 `--overwrite` 重新執行。提供者仍可在遷移報告目錄中，為遭覆寫的檔案寫入項目層級備份。
  </Accordion>
  <Accordion title="機密">
    預設絕不匯入機密。使用 `--include-secrets` 匯入支援的憑證。
  </Accordion>
</AccordionGroup>

## Claude 提供者

內建 Claude 提供者預設會在 `~/.claude` 偵測 Claude Code 狀態。使用 `--from <path>` 匯入特定 Claude Code 主目錄或專案根目錄。

<Tip>
如需面向使用者的逐步指南，請參閱[從 Claude 遷移](/zh-TW/install/migrating-claude)。
</Tip>

### Claude 匯入的內容

- 專案 `CLAUDE.md` 和 `.claude/CLAUDE.md` 匯入 OpenClaw 代理工作區。
- 使用者 `~/.claude/CLAUDE.md` 附加到工作區 `USER.md`。
- 來自專案 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 伺服器定義。
- 包含 `SKILL.md` 的 Claude 技能目錄。
- Claude 命令 Markdown 檔案會轉換為僅限手動叫用的 OpenClaw 技能。

### 封存與手動檢閱狀態

Claude hook、權限、環境預設值、本機記憶體、路徑範圍規則、子代理、快取、計畫和專案歷史會保留在遷移報告中，或回報為手動檢閱項目。OpenClaw 不會自動執行 hook、複製廣泛允許清單，或匯入 OAuth/Desktop 憑證狀態。

## Codex 提供者

內建 Codex 提供者預設會在 `~/.codex` 偵測 Codex CLI 狀態，或在設定該環境變數時於 `CODEX_HOME` 偵測。使用 `--from <path>` 清點特定 Codex 主目錄。

當你要移至 OpenClaw Codex harness，並想有意識地提升實用的個人 Codex CLI 資產時，請使用此提供者。本機 Codex 應用程式伺服器啟動會使用每個代理各自的 `CODEX_HOME` 和 `HOME` 目錄，因此預設不會讀取你的個人 Codex CLI 狀態。

在互動式終端機中執行 `openclaw migrate codex` 會預覽完整計畫，然後在最終套用確認前開啟核取方塊選擇器。技能複製項目會先提示。使用 `Toggle all on` 或 `Toggle all off` 進行大量選取。按 Space 切換列，或按 Enter 啟用反白列並繼續。已規劃技能一開始會勾選，有衝突的技能一開始不勾選，而 `Skip for now` 會略過本次執行的技能複製，同時仍繼續進入 Plugin 選擇。當來源端已安裝的精選 Codex Plugin 可遷移且未提供 `--plugin` 時，遷移接著會依 Plugin 名稱提示原生 Codex Plugin 啟用。Plugin 項目一開始會勾選，除非目標 OpenClaw Codex Plugin 設定已有該 Plugin。現有目標 Plugin 一開始不勾選，並顯示衝突提示，例如 `conflict: plugin exists`；選擇 `Toggle all off` 可在該次執行中不遷移任何原生 Codex Plugin，或選擇 `Skip for now` 在套用前停止。若要以指令碼或精確方式執行，請針對每個技能傳入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 可在非互動模式中，將原生 Codex Plugin 遷移限制為一個或多個來源端已安裝的精選 Plugin：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 匯入的內容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目錄，不包含 Codex 的 `.system` 快取。
- `$HOME/.agents/skills` 下的個人 AgentSkills，當你需要每個代理擁有權時，會複製到目前的 OpenClaw 代理工作區。
- 透過 Codex 應用程式伺服器 `plugin/list` 探索到、來源端已安裝的 `openai-curated` Codex Plugin。規劃會針對每個已啟用且已安裝的 Plugin 讀取 `plugin/read`。應用程式支援的 Plugin 需要來源 Codex 應用程式伺服器帳號回應是 ChatGPT 訂閱帳號；非 ChatGPT 或缺少帳號回應會以 `codex_subscription_required` 略過。預設情況下，遷移不會呼叫來源 `app/list`，因此通過帳號閘門的應用程式支援 Plugin，會在未驗證來源應用程式可存取性的情況下納入規劃；帳號查詢傳輸失敗會以 `codex_account_unavailable` 略過。當你希望遷移強制取得新的來源 `app/list` 快照，並要求每個擁有的應用程式在規劃原生啟用前都存在、已啟用且可存取時，請傳入 `--verify-plugin-apps`。在該模式中，帳號查詢傳輸失敗會改為落到來源應用程式清單驗證。來源應用程式清單快照會保留在目前程序的記憶體中；不會寫入遷移輸出或目標設定。已停用的 Plugin、無法讀取的 Plugin 詳細資料、受訂閱限制的來源帳號，以及在要求驗證時缺少應用程式、已停用應用程式、無法存取的應用程式或來源應用程式清單失敗，都會成為具有型別化原因的手動略過項目，而不是目標設定項目。
  套用會針對每個選取且符合資格的 Plugin 呼叫應用程式伺服器 `plugin/install`，即使目標應用程式伺服器已回報該 Plugin 已安裝且已啟用。遷移後的 Codex Plugin 只能在選取原生 Codex harness 的工作階段中使用；不會暴露給 Pi、一般 OpenAI 提供者執行、ACP 對話繫結或其他 harness。

### 手動檢閱的 Codex 狀態

Codex `config.toml`、原生 `hooks/hooks.json`、非精選市集、不是來源端已安裝精選 Plugin 的快取 Plugin bundle，以及未通過來源訂閱閘門的來源端已安裝 Plugin，不會自動啟用。設定 `--verify-plugin-apps` 時，未通過來源應用程式清單閘門的 Plugin 也會略過。它們會被複製或回報到遷移報告中，以供手動檢閱。

對於遷移後來源端已安裝的精選 Plugin，套用會寫入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 每個選取的 Plugin 會有一個明確 Plugin 項目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

遷移絕不寫入 `plugins["*"]`，也絕不儲存本機市集快取路徑。來源端訂閱失敗會在手動項目上以型別化原因回報，例如 `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 時，來源應用程式清單失敗也可能顯示為 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。略過的 Plugin 不會寫入目標設定。
目標端需要驗證的安裝會在受影響的 Plugin 項目上以 `status: "skipped"`、`reason: "auth_required"` 和已清理的應用程式識別碼回報。它們的明確設定項目會以停用狀態寫入，直到你重新授權並啟用它們。其他安裝失敗會是項目範圍的 `error` 結果。

如果 Codex 應用程式伺服器 Plugin 清單在規劃期間無法使用，遷移會退回到快取 bundle 建議項目，而不是讓整個遷移失敗。

## Hermes 提供者

內建 Hermes 提供者預設會在 `~/.hermes` 偵測狀態。當 Hermes 位於其他位置時，請使用 `--from <path>`。

### Hermes 匯入的內容

- `config.yaml` 中的預設模型設定。
- 來自 `providers` 和 `custom_providers` 的已設定模型供應商與自訂 OpenAI 相容端點。
- 來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
- 將 `SOUL.md` 和 `AGENTS.md` 放入 OpenClaw agent 工作區。
- 將 `memories/MEMORY.md` 和 `memories/USER.md` 附加到工作區記憶檔案。
- OpenClaw 檔案記憶體的記憶體設定預設值，以及 Honcho 等外部記憶體供應商的封存或手動審查項目。
- 在 `skills/<name>/` 下包含 `SKILL.md` 檔案的 Skills。
- 來自 `skills.config` 的各 Skills 設定值。
- 來自 `.env` 的支援 API 金鑰，僅限搭配 `--include-secrets`。

### 支援的 `.env` 金鑰

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 僅封存狀態

OpenClaw 無法安全解讀的 Hermes 狀態會複製到遷移報告中供手動審查，但不會載入到即時 OpenClaw 設定或憑證中。這會保留不透明或不安全的狀態，而不假裝 OpenClaw 能自動執行或信任它：

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

遷移來源是 Plugin。Plugin 會在 `openclaw.plugin.json` 中宣告其供應商 ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

在執行階段，Plugin 會呼叫 `api.registerMigrationProvider(...)`。供應商會實作 `detect`、`plan` 和 `apply`。核心負責 CLI 協調、備份政策、提示、JSON 輸出和衝突預先檢查。核心會將已審查的計畫傳入 `apply(ctx, plan)`，而供應商僅可在為了相容性而缺少該引數時重新建置計畫。

供應商 Plugin 可以使用 `openclaw/plugin-sdk/migration` 來建構項目與摘要計數，並使用 `openclaw/plugin-sdk/migration-runtime` 進行具衝突感知的檔案複製、僅封存報告複製、快取的設定執行階段包裝器，以及遷移報告。

## Onboarding 整合

當供應商偵測到已知來源時，Onboarding 可以提供遷移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的 Plugin 遷移供應商，並且仍會在套用前顯示預覽。

<Note>
Onboarding 匯入需要全新的 OpenClaw 設定。如果你已有本機狀態，請先重設設定、憑證、工作階段和工作區。備份加覆寫或合併匯入功能已針對現有設定進行功能閘控。
</Note>

## 相關

- [從 Hermes 遷移](/zh-TW/install/migrating-hermes)：面向使用者的逐步指南。
- [從 Claude 遷移](/zh-TW/install/migrating-claude)：面向使用者的逐步指南。
- [遷移](/zh-TW/install/migrating)：將 OpenClaw 移至新機器。
- [Doctor](/zh-TW/gateway/doctor)：套用遷移後的健康檢查。
- [Plugins](/zh-TW/tools/plugin)：Plugin 安裝與註冊。
