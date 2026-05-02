---
read_when:
    - 新增或修改模型 CLI (models list/set/scan/aliases/fallbacks)
    - 變更模型備援行為或選擇使用者體驗
    - 更新模型掃描探針 (工具/圖片)
sidebarTitle: Models CLI
summary: 模型 CLI：list、set、aliases、fallbacks、scan、status
title: 模型 CLI
x-i18n:
    generated_at: "2026-05-02T02:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    驗證設定檔輪替、冷卻時間，以及它如何與後援互動。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers">
    快速的供應商概覽與範例。
  </Card>
  <Card title="Agent 執行環境" href="/zh-TW/concepts/agent-runtimes">
    PI、Codex 和其他 agent 迴圈執行環境。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵。
  </Card>
</CardGroup>

模型參照會選擇供應商和模型。它們通常不會選擇低階 agent 執行環境。例如，`openai/gpt-5.5` 可以透過一般 OpenAI 供應商路徑執行，也可以透過 Codex app-server 執行環境執行，取決於 `agents.defaults.agentRuntime.id`。在 Codex 執行環境模式中，`openai/gpt-*` 參照不代表 API 金鑰計費；驗證可以來自 Codex 帳號或 `openai-codex` 驗證設定檔。請參閱 [Agent 執行環境](/zh-TW/concepts/agent-runtimes)。

## 模型選擇的運作方式

OpenClaw 會依照以下順序選擇模型：

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="後援">
    `agents.defaults.model.fallbacks`（依序）。
  </Step>
  <Step title="供應商驗證容錯移轉">
    驗證容錯移轉會先在供應商內部發生，然後才移到下一個模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相關模型介面">
    - `agents.defaults.models` 是 OpenClaw 可使用模型的允許清單/目錄（加上別名）。
    - `agents.defaults.imageModel` **只會在**主要模型無法接受圖片時使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，該工具會後援到 `agents.defaults.imageModel`，接著是已解析的工作階段/預設模型。
    - `agents.defaults.imageGenerationModel` 由共用的圖片生成能力使用。如果省略，`image_generate` 仍可推斷由驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的圖片生成供應商。如果你設定特定供應商/模型，也要設定該供應商的驗證/API 金鑰。
    - `agents.defaults.musicGenerationModel` 由共用的音樂生成能力使用。如果省略，`music_generate` 仍可推斷由驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的音樂生成供應商。如果你設定特定供應商/模型，也要設定該供應商的驗證/API 金鑰。
    - `agents.defaults.videoGenerationModel` 由共用的影片生成能力使用。如果省略，`video_generate` 仍可推斷由驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的影片生成供應商。如果你設定特定供應商/模型，也要設定該供應商的驗證/API 金鑰。
    - 個別 agent 預設值可以透過 `agents.list[].model` 加上繫結覆寫 `agents.defaults.model`（請參閱[多 agent 路由](/zh-TW/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 選擇來源與後援行為

相同的 `provider/model` 可能會因來源不同而代表不同意義：

- 已設定的預設值（`agents.defaults.model.primary` 和 agent 專屬主要模型）是一般起點，並使用 `agents.defaults.model.fallbacks`。
- 自動後援選擇是暫時的復原狀態。它們會以 `modelOverrideSource: "auto"` 儲存，讓後續回合可以繼續使用後援鏈，而不必先探測已知有問題的主要模型。
- 使用者工作階段選擇是精確的。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`；如果所選的供應商/模型無法連線，OpenClaw 會明確失敗，而不是落到另一個已設定模型。
- Cron `--model` / 承載 `model` 是每個工作的主要模型。除非工作提供明確承載 `fallbacks`，否則它仍會使用已設定的後援（若要嚴格執行 cron，請使用 `fallbacks: []`）。
- CLI 預設模型和允許清單選擇器會遵循 `models.mode: "replace"`，列出明確的 `models.providers.*.models`，而不是載入完整內建目錄。
- Control UI 模型選擇器會向 Gateway 要求其已設定的模型檢視：有 `agents.defaults.models` 時使用它，否則使用明確的 `models.providers.*.models` 加上具備可用驗證的供應商。完整內建目錄只保留給明確的瀏覽檢視，例如帶有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型原則

- 將主要模型設為你可用的最強最新世代模型。
- 對成本/延遲敏感的任務和較低風險的聊天使用後援。
- 對已啟用工具的 agent 或不受信任的輸入，避免使用較舊/較弱的模型層級。

## 入門設定（建議）

如果你不想手動編輯設定，請執行入門設定：

```bash
openclaw onboard
```

它可以為常見供應商設定模型與驗證，包括 **OpenAI Code (Codex) 訂閱**（OAuth）和 **Anthropic**（API 金鑰或 Claude CLI）。

## 設定鍵（概覽）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允許清單 + 別名 + 供應商參數）
- `models.providers`（寫入 `models.json` 的自訂供應商）

<Note>
模型參照會正規化為小寫。像 `z.ai/*` 這類供應商別名會正規化為 `zai/*`。

供應商設定範例（包括 OpenCode）位於 [OpenCode](/zh-TW/providers/opencode)。
</Note>

### 安全的允許清單編輯

手動更新 `agents.defaults.models` 時，請使用加法寫入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="防覆寫保護規則">
    `openclaw config set` 會保護模型/供應商映射，避免意外覆寫。當對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 進行一般物件指派且會移除現有項目時，該操作會被拒絕。使用 `--merge` 進行加法變更；只有在提供的值應成為完整目標值時，才使用 `--replace`。

    互動式供應商設定和 `openclaw configure --section model` 也會將供應商範圍的選擇合併到現有允許清單中，因此新增 Codex、Ollama 或其他供應商不會刪除無關的模型項目。重新套用供應商驗證時，Configure 會保留現有的 `agents.defaults.model.primary`。明確設定預設值的命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍會取代 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## 「模型不被允許」（以及為什麼回覆會停止）

如果設定了 `agents.defaults.models`，它會成為 `/model` 和工作階段覆寫的**允許清單**。當使用者選擇不在該允許清單中的模型時，OpenClaw 會回傳：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
這會在產生一般回覆**之前**發生，因此訊息可能感覺像是「沒有回應」。修正方式是：

- 將模型加入 `agents.defaults.models`，或
- 清除允許清單（移除 `agents.defaults.models`），或
- 從 `/model list` 選擇模型。

</Warning>

對於本機/GGUF 模型，請在允許清單中儲存完整的供應商前綴參照，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 顯示的確切供應商/模型。
當允許清單啟用時，單純的本機檔名或顯示名稱並不足夠。

允許清單設定範例：

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 在聊天中切換模型（`/model`）

你可以不重新啟動就切換目前工作階段的模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="選擇器行為">
    - `/model`（和 `/model list`）是精簡的編號選擇器（模型家族 + 可用供應商）。
    - 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含供應商和模型下拉選單，以及送出步驟。
    - `/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。
    - `/model <#>` 會從該選擇器中選取。

  </Accordion>
  <Accordion title="持久化與即時切換">
    - `/model` 會立即保存新的工作階段選擇。
    - 如果 agent 閒置，下一次執行會立刻使用新模型。
    - 如果已有執行正在進行，OpenClaw 會將即時切換標記為待處理，並且只會在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理的切換可能會排隊到後續重試機會或下一個使用者回合。
    - 使用者選取的 `/model` 參照對該工作階段是嚴格的：如果選取的供應商/模型無法連線，回覆會明確失敗，而不是悄悄從 `agents.defaults.model.fallbacks` 回答。這不同於已設定的預設值和 cron 工作主要模型，後者仍可使用後援鏈。
    - `/model status` 是詳細檢視（驗證候選項，以及在已設定時顯示供應商端點 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="參照解析">
    - 模型參照會透過第一個 `/` 分割來解析。輸入 `/model <ref>` 時請使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 風格），你必須包含供應商前綴（範例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略供應商，OpenClaw 會依以下順序解析輸入：
      1. 別名相符
      2. 該精確無前綴模型 ID 的唯一已設定供應商相符
      3. 已棄用的後援到已設定預設供應商 — 如果該供應商不再公開已設定的預設模型，OpenClaw 會改為後援到第一個已設定的供應商/模型，以避免顯示過時且已移除的供應商預設值。
  </Accordion>
</AccordionGroup>

完整命令行為/設定：[Slash commands](/zh-TW/tools/slash-commands)。

## CLI 命令

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（沒有子命令）是 `models status` 的捷徑。

### `models list`

預設顯示已設定/驗證可用的模型。實用旗標：

<ParamField path="--all" type="boolean">
  完整目錄。包含在設定驗證之前由隨附供應商擁有的靜態目錄列，因此僅探索檢視可以顯示必須等到你新增相符供應商憑證後才可用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  僅限本機供應商。
</ParamField>
<ParamField path="--provider <id>" type="string">
  依供應商 id 篩選，例如 `moonshot`。不接受互動式選擇器中的顯示標籤。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一個模型。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出。
</ParamField>

### `models status`

顯示已解析的主要模型、後備模型、影像模型，以及已設定供應商的驗證概覽。它也會顯示在驗證儲存區中找到的設定檔 OAuth 到期狀態（預設在 24 小時內發出警告）。`--plain` 只列印已解析的主要模型。

<AccordionGroup>
  <Accordion title="驗證與探測行為">
    - OAuth 狀態一律顯示（也包含在 `--json` 輸出中）。如果已設定的供應商沒有憑證，`models status` 會列印 **缺少驗證** 區段。
    - JSON 包含 `auth.oauth`（警告時間範圍 + 設定檔）和 `auth.providers`（每個供應商的有效驗證，包括由 env 支援的憑證）。`auth.oauth` 僅是驗證儲存區設定檔健康狀態；僅 env 的供應商不會出現在其中。
    - 對自動化使用 `--check`（缺少/已到期時以 `1` 結束，即將到期時以 `2` 結束）。
    - 對即時驗證檢查使用 `--probe`；探測列可來自驗證設定檔、env 憑證或 `models.json`。
    - 如果明確的 `auth.order.<provider>` 省略了已儲存的設定檔，探測會回報 `excluded_by_auth_order`，而不是嘗試該設定檔。如果驗證存在，但無法為該供應商解析可探測的模型，探測會回報 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
驗證選擇取決於供應商/帳戶。對於常駐的 Gateway 主機，API 金鑰通常最可預測；也支援重用 Claude CLI 以及既有的 Anthropic OAuth/token 設定檔。
</Note>

範例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 掃描（OpenRouter 免費模型）

`openclaw models scan` 會檢查 OpenRouter 的**免費模型目錄**，並可選擇性探測模型是否支援工具與影像。

<ParamField path="--no-probe" type="boolean">
  略過即時探測（僅中繼資料）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小參數大小（十億）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  略過較舊的模型。
</ParamField>
<ParamField path="--provider <name>" type="string">
  供應商前綴篩選器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  後備清單大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  將 `agents.defaults.model.primary` 設為第一個選項。
</ParamField>
<ParamField path="--set-image" type="boolean">
  將 `agents.defaults.imageModel.primary` 設為第一個影像選項。
</ParamField>

<Note>
OpenRouter `/models` 目錄是公開的，因此僅中繼資料掃描可以在沒有金鑰的情況下列出免費候選項目。探測與推論仍需要 OpenRouter API 金鑰（來自驗證設定檔或 `OPENROUTER_API_KEY`）。如果沒有可用金鑰，`openclaw models scan` 會退回到僅中繼資料輸出，並保持設定不變。使用 `--no-probe` 可明確要求僅中繼資料模式。
</Note>

掃描結果依下列項目排名：

1. 影像支援
2. 工具延遲
3. 上下文大小
4. 參數數量

輸入：

- OpenRouter `/models` 清單（篩選 `:free`）
- 即時探測需要來自驗證設定檔或 `OPENROUTER_API_KEY` 的 OpenRouter API 金鑰（請參閱[環境變數](/zh-TW/help/environment)）
- 選用篩選器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 請求/探測控制：`--timeout`、`--concurrency`

當即時探測在 TTY 中執行時，你可以互動式選取後備模型。在非互動模式下，傳入 `--yes` 以接受預設值。僅中繼資料結果僅供參考；`--set-default` 和 `--set-image` 需要即時探測，因此 OpenClaw 不會設定無法使用且沒有金鑰的 OpenRouter 模型。

## 模型登錄檔（`models.json`）

`models.providers` 中的自訂供應商會寫入代理程式目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 設為 `replace`，否則預設會合併此檔案。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    相符供應商 ID 的合併模式優先順序：

    - 代理程式 `models.json` 中已存在的非空 `baseUrl` 優先。
    - 代理程式 `models.json` 中的非空 `apiKey` 只有在該供應商未於目前設定/驗證設定檔情境中由 SecretRef 管理時才優先。
    - SecretRef 管理的供應商 `apiKey` 值會從來源標記重新整理（env 參照為 `ENV_VAR_NAME`，file/exec 參照為 `secretref-managed`），而不是持久保存已解析的密鑰。
    - SecretRef 管理的供應商 header 值會從來源標記重新整理（env 參照為 `secretref-env:ENV_VAR_NAME`，file/exec 參照為 `secretref-managed`）。
    - 空白或缺少的代理程式 `apiKey`/`baseUrl` 會退回到設定 `models.providers`。
    - 其他供應商欄位會從設定與正規化的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

<Note>
標記持久保存以來源為準：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段密鑰值寫入。這適用於 OpenClaw 重新產生 `models.json` 的任何情況，包括像 `openclaw agent` 這類由命令驅動的路徑。
</Note>

## 相關

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes) — PI、Codex 和其他代理程式迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [影像生成](/zh-TW/tools/image-generation) — 影像模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 後備鏈
- [模型供應商](/zh-TW/concepts/model-providers) — 供應商路由與驗證
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
