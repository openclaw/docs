---
read_when:
    - 新增或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 變更模型備援行為或選擇使用者體驗
    - 更新模型掃描探針（工具/圖片）
sidebarTitle: Models CLI
summary: 模型 CLI：列出、設定、別名、備援、掃描、狀態
title: 模型 CLI
x-i18n:
    generated_at: "2026-05-10T19:31:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    驗證設定檔輪替、冷卻，以及它與後援的互動方式。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers">
    提供者快速概觀與範例。
  </Card>
  <Card title="代理程式執行階段" href="/zh-TW/concepts/agent-runtimes">
    Pi、Codex 和其他代理程式迴圈執行階段。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵。
  </Card>
</CardGroup>

模型參照會選擇提供者和模型。它們通常不會選擇低階代理程式執行階段。OpenAI 代理程式參照是主要例外：在官方 OpenAI 提供者上，`openai/gpt-5.5` 預設會透過 Codex app-server 執行階段執行。明確的執行階段覆寫屬於提供者/模型政策，而不是整個代理程式或工作階段。在 Codex 執行階段模式中，`openai/gpt-*` 參照不表示使用 API 金鑰計費；驗證可來自 Codex 帳戶或 `openai-codex` 驗證設定檔。請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

## 模型選擇如何運作

OpenClaw 會依此順序選擇模型：

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="後援">
    `agents.defaults.model.fallbacks`（依順序）。
  </Step>
  <Step title="提供者驗證容錯移轉">
    驗證容錯移轉會在提供者內部發生，然後才移至下一個模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相關模型介面">
    - `agents.defaults.models` 是 OpenClaw 可使用模型的允許清單/目錄（外加別名）。使用 `provider/*` 項目可限制可見提供者，同時保持提供者探索為動態。
    - `agents.defaults.imageModel` **只在**主要模型無法接受圖片時使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，該工具會退回到 `agents.defaults.imageModel`，再退回到已解析的工作階段/預設模型。
    - `agents.defaults.imageGenerationModel` 由共用圖片生成能力使用。如果省略，`image_generate` 仍可推斷由驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的圖片生成提供者。如果你設定特定提供者/模型，也請設定該提供者的驗證/API 金鑰。
    - `agents.defaults.musicGenerationModel` 由共用音樂生成能力使用。如果省略，`music_generate` 仍可推斷由驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。如果你設定特定提供者/模型，也請設定該提供者的驗證/API 金鑰。
    - `agents.defaults.videoGenerationModel` 由共用影片生成能力使用。如果省略，`video_generate` 仍可推斷由驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。如果你設定特定提供者/模型，也請設定該提供者的驗證/API 金鑰。
    - 個別代理程式預設值可以透過 `agents.list[].model` 加上繫結來覆寫 `agents.defaults.model`（請參閱[多代理程式路由](/zh-TW/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 選擇來源與後援行為

相同的 `provider/model` 可能會依來源不同而代表不同含義：

- 已設定的預設值（`agents.defaults.model.primary` 和代理程式專屬主要模型）是一般起點，並使用 `agents.defaults.model.fallbacks`。
- 自動後援選擇是暫時的復原狀態。它們會以 `modelOverrideSource: "auto"` 儲存，讓後續回合能持續使用後援鏈，而不必先探測已知不良的主要模型。
- 使用者工作階段選擇是精確的。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`；如果所選提供者/模型無法連線，OpenClaw 會明確失敗，而不是落到另一個已設定模型。
- Cron `--model` / 承載 `model` 是每個工作的主要模型。除非該工作提供明確承載 `fallbacks`，否則仍會使用已設定的後援（使用 `fallbacks: []` 可執行嚴格的 cron 執行）。
- CLI 預設模型和允許清單選擇器會遵循 `models.mode: "replace"`，列出明確的 `models.providers.*.models`，而不是載入完整內建目錄。
- Control UI 模型選擇器會向 Gateway 要求其已設定的模型視圖：如果存在，使用 `agents.defaults.models`，包含提供者範圍的 `provider/*` 項目；否則使用明確的 `models.providers.*.models` 加上具有可用驗證的提供者。完整內建目錄保留給明確瀏覽視圖，例如帶有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型政策

- 將主要模型設為你可用的最強最新世代模型。
- 對成本/延遲敏感的工作和低風險聊天使用後援。
- 對啟用工具的代理程式或不受信任的輸入，避免使用較舊/較弱的模型層級。

## 初始設定（建議）

如果你不想手動編輯設定，請執行初始設定：

```bash
openclaw onboard
```

它可以為常見提供者設定模型 + 驗證，包括 **OpenAI Code (Codex) 訂閱**（OAuth）和 **Anthropic**（API 金鑰或 Claude CLI）。

## 設定鍵（概觀）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允許清單 + 別名 + 提供者參數 + `provider/*` 動態提供者項目）
- `models.providers`（寫入 `models.json` 的自訂提供者）

<Note>
模型參照會正規化為小寫。像 `z.ai/*` 這類提供者別名會正規化為 `zai/*`。

提供者設定範例（包括 OpenCode）位於 [OpenCode](/zh-TW/providers/opencode)。
</Note>

### 安全的允許清單編輯

手動更新 `agents.defaults.models` 時，請使用增量寫入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆寫保護規則">
    `openclaw config set` 會保護模型/提供者對應表，避免意外覆寫。當對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的一般物件指派會移除現有項目時，該指派會被拒絕。使用 `--merge` 進行增量變更；只有在提供的值應成為完整目標值時，才使用 `--replace`。

    互動式提供者設定和 `openclaw configure --section model` 也會將提供者範圍的選擇合併到現有允許清單，因此新增 Codex、Ollama 或其他提供者不會移除不相關的模型項目。重新套用提供者驗證時，Configure 會保留現有的 `agents.defaults.model.primary`。明確設定預設值的命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍會取代 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## 「模型不被允許」（以及為什麼回覆會停止）

如果設定了 `agents.defaults.models`，它會成為 `/model` 和工作階段覆寫的**允許清單**。當使用者選擇不在該允許清單中的模型時，OpenClaw 會回傳：

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
這會在產生一般回覆**之前**發生，因此訊息可能感覺像是「沒有回應」。修正方式是擇一：

- 將模型加入 `agents.defaults.models`，或
- 清除允許清單（移除 `agents.defaults.models`），或
- 從 `/model list` 選擇模型。

</Warning>

當被拒絕的命令包含執行階段覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正允許清單，然後重試相同的 `/model ... --runtime ...` 命令。對原生 Codex 執行而言，所選模型仍是 `openai/gpt-5.5`；`codex` 執行階段會選擇 harness，並另外使用 Codex 驗證。

對本機/GGUF 模型，請在允許清單中儲存完整的提供者前綴參照，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 顯示的確切 provider/model。
當允許清單啟用時，只有本機檔名或顯示名稱並不足夠。

如果你想限制提供者，而不手動列出每個模型，請將
`provider/*` 項目加入 `agents.defaults.models`：

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

使用該政策時，`/model`、`/models` 和模型選擇器只會顯示這些提供者的已探索目錄。所選提供者的新模型可以在不編輯允許清單的情況下出現。當你需要另一個提供者中的特定模型時，精確的 `provider/model` 項目可以與 `provider/*` 項目混用。

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

你可以在不重新啟動的情況下，為目前工作階段切換模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="選擇器行為">
    - `/model`（和 `/model list`）是精簡的編號選擇器（模型系列 + 可用提供者）。
    - 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含提供者與模型下拉選單，以及 Submit 步驟。
    - 在 Telegram 上，`/models` 選擇器的選擇是工作階段範圍；它們不會變更代理程式在 `openclaw.json` 中的持久預設值。
    - `/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。
    - `/model <#>` 會從該選擇器中選取。

  </Accordion>
  <Accordion title="持久化與即時切換">
    - `/model` 會立即持久化新的工作階段選擇。
    - 如果代理程式閒置，下一次執行會立刻使用新模型。
    - 如果已有執行在進行中，OpenClaw 會將即時切換標記為待處理，並只在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理切換可能會保持佇列狀態，直到之後的重試機會或下一個使用者回合。
    - 使用者選擇的 `/model` 參照對該工作階段是嚴格的：如果所選提供者/模型無法連線，回覆會明確失敗，而不是靜默地從 `agents.defaults.model.fallbacks` 回答。這不同於已設定的預設值和 cron 工作主要模型，後者仍可使用後援鏈。
    - `/model status` 是詳細視圖（驗證候選項，以及設定時的提供者端點 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="參照解析">
    - 模型參照會依據**第一個** `/` 分割。輸入 `/model <ref>` 時請使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 風格），你必須包含 provider 前綴（範例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果你省略 provider，OpenClaw 會依照以下順序解析輸入：
      1. alias 相符
      2. 針對該精確未加前綴模型 id 的唯一已設定 provider 相符
      3. 已棄用的後援至已設定的預設 provider — 如果該 provider 不再公開已設定的預設模型，OpenClaw 會改為後援至第一個已設定的 provider/model，避免顯示已移除 provider 的過時預設值。
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

`openclaw models`（無子命令）是 `models status` 的捷徑。

### `models list`

預設顯示已設定/可用驗證的模型。實用旗標：

<ParamField path="--all" type="boolean">
  完整目錄。包含在設定驗證前由隨附 provider 擁有的靜態目錄列，因此僅供探索的檢視可以顯示在你新增相符 provider 憑證前不可用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  僅限本機 provider。
</ParamField>
<ParamField path="--provider <id>" type="string">
  依 provider id 篩選，例如 `moonshot`。不接受互動式選擇器中的顯示標籤。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一個模型。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出。
</ParamField>

### `models status`

顯示已解析的主要模型、後援、圖片模型，以及已設定 provider 的驗證概覽。它也會顯示在驗證儲存中找到的設定檔 OAuth 到期狀態（預設於 24 小時內警告）。`--plain` 只會列印已解析的主要模型。

<AccordionGroup>
  <Accordion title="驗證與探測行為">
    - OAuth 狀態一律顯示（也包含在 `--json` 輸出中）。如果已設定的 provider 沒有憑證，`models status` 會列印 **缺少驗證** 區段。
    - JSON 包含 `auth.oauth`（警告視窗 + 設定檔）與 `auth.providers`（每個 provider 的有效驗證，包含 env 支援的憑證）。`auth.oauth` 只代表驗證儲存中的設定檔健康狀態；僅使用 env 的 provider 不會出現在其中。
    - 自動化請使用 `--check`（缺少/已到期時結束碼為 `1`，即將到期時為 `2`）。
    - 即時驗證檢查請使用 `--probe`；探測列可來自驗證設定檔、env 憑證或 `models.json`。
    - 如果明確的 `auth.order.<provider>` 省略了已儲存的設定檔，探測會回報 `excluded_by_auth_order`，而不是嘗試該設定檔。如果驗證存在，但無法為該 provider 解析可探測模型，探測會回報 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
驗證選擇取決於 provider/帳號。對於常駐 Gateway 主機，API 金鑰通常最可預測；也支援重複使用 Claude CLI 以及既有的 Anthropic OAuth/token 設定檔。
</Note>

範例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 掃描（OpenRouter 免費模型）

`openclaw models scan` 會檢查 OpenRouter 的**免費模型目錄**，並可選擇性探測模型是否支援工具與圖片。

<ParamField path="--no-probe" type="boolean">
  略過即時探測（僅中繼資料）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小參數規模（十億）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  略過較舊的模型。
</ParamField>
<ParamField path="--provider <name>" type="string">
  Provider 前綴篩選器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  後援清單大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  將 `agents.defaults.model.primary` 設為第一個選項。
</ParamField>
<ParamField path="--set-image" type="boolean">
  將 `agents.defaults.imageModel.primary` 設為第一個圖片選項。
</ParamField>

<Note>
OpenRouter `/models` 目錄是公開的，因此僅中繼資料掃描可以在沒有金鑰的情況下列出免費候選項目。探測與推論仍需要 OpenRouter API 金鑰（來自驗證設定檔或 `OPENROUTER_API_KEY`）。如果沒有可用金鑰，`openclaw models scan` 會後援至僅中繼資料輸出，並保持設定不變。使用 `--no-probe` 可明確要求僅中繼資料模式。
</Note>

掃描結果依以下項目排序：

1. 圖片支援
2. 工具延遲
3. Context 大小
4. 參數數量

輸入：

- OpenRouter `/models` 清單（篩選 `:free`）
- 即時探測需要來自驗證設定檔或 `OPENROUTER_API_KEY` 的 OpenRouter API 金鑰（請參閱[環境變數](/zh-TW/help/environment)）
- 選用篩選器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 請求/探測控制：`--timeout`、`--concurrency`

在 TTY 中執行即時探測時，你可以互動式選擇後援。在非互動模式中，傳入 `--yes` 以接受預設值。僅中繼資料結果僅供參考；`--set-default` 與 `--set-image` 需要即時探測，避免 OpenClaw 設定無法使用的無金鑰 OpenRouter 模型。

## 模型登錄檔（`models.json`）

`models.providers` 中的自訂 provider 會寫入代理目錄下的 `models.json`（預設 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 設為 `replace`，否則預設會合併此檔案。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    相符 provider ID 的合併模式優先順序：

    - 代理 `models.json` 中已存在的非空 `baseUrl` 優先。
    - 代理 `models.json` 中的非空 `apiKey` 只有在該 provider 未於目前 config/auth-profile context 中由 SecretRef 管理時優先。
    - 由 SecretRef 管理的 provider `apiKey` 值會從來源標記重新整理（env 參照使用 `ENV_VAR_NAME`，file/exec 參照使用 `secretref-managed`），而不是持續保存已解析的密鑰。
    - 由 SecretRef 管理的 provider 標頭值會從來源標記重新整理（env 參照使用 `secretref-env:ENV_VAR_NAME`，file/exec 參照使用 `secretref-managed`）。
    - 空白或缺少的代理 `apiKey`/`baseUrl` 會後援至 config `models.providers`。
    - 其他 provider 欄位會從 config 與正規化後的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

<Note>
標記持續保存以來源為準：OpenClaw 會從作用中的來源 config 快照（解析前）寫入標記，而不是從已解析的執行階段密鑰值寫入。每當 OpenClaw 重新產生 `models.json` 時都會套用此行為，包含像 `openclaw agent` 這類命令驅動路徑。
</Note>

## 相關

- [Agent runtimes](/zh-TW/concepts/agent-runtimes) — PI、Codex，以及其他代理迴圈執行階段
- [Configuration reference](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [Image generation](/zh-TW/tools/image-generation) — 圖片模型設定
- [Model failover](/zh-TW/concepts/model-failover) — 後援鏈
- [Model providers](/zh-TW/concepts/model-providers) — provider 路由與驗證
- [Music generation](/zh-TW/tools/music-generation) — 音樂模型設定
- [Video generation](/zh-TW/tools/video-generation) — 影片模型設定
