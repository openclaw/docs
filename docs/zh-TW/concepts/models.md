---
read_when:
    - 新增或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 變更模型備援行為或選擇體驗
    - 更新模型掃描探針（工具/影像）
sidebarTitle: Models CLI
summary: 模型 CLI：列出、設定、別名、備援、掃描、狀態
title: 模型 CLI
x-i18n:
    generated_at: "2026-05-11T20:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型故障轉移" href="/zh-TW/concepts/model-failover">
    Auth profile 輪替、冷卻時間，以及它們如何與 fallback 互動。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers">
    供應商快速概覽與範例。
  </Card>
  <Card title="代理執行環境" href="/zh-TW/concepts/agent-runtimes">
    PI、Codex 和其他代理迴圈執行環境。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵。
  </Card>
</CardGroup>

模型參照會選擇供應商和模型。它們通常不會選擇底層代理執行環境。OpenAI 代理參照是主要例外：`openai/gpt-5.5` 預設會在官方 OpenAI 供應商上透過 Codex app-server 執行環境執行。明確的執行環境覆寫應放在供應商/模型政策上，而不是整個代理或工作階段上。在 Codex 執行環境模式中，`openai/gpt-*` 參照不代表 API 金鑰計費；驗證可以來自 Codex 帳號或 `openai-codex` auth profile。請參閱[代理執行環境](/zh-TW/concepts/agent-runtimes)。

## 模型選擇的運作方式

OpenClaw 依照以下順序選擇模型：

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="Fallback">
    `agents.defaults.model.fallbacks`（依序）。
  </Step>
  <Step title="供應商驗證故障轉移">
    Auth failover 會在供應商內部發生，然後才移至下一個模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相關模型介面">
    - `agents.defaults.models` 是 OpenClaw 可使用模型的 allowlist/目錄（加上別名）。使用 `provider/*` 項目可限制可見供應商，同時保持供應商探索為動態。
    - `agents.defaults.imageModel` **只有在**主要模型無法接受圖片時才會使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。若省略，工具會 fallback 到 `agents.defaults.imageModel`，然後是解析後的工作階段/預設模型。
    - `agents.defaults.imageGenerationModel` 由共用圖片生成能力使用。若省略，`image_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的圖片生成供應商。若設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - `agents.defaults.musicGenerationModel` 由共用音樂生成能力使用。若省略，`music_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的音樂生成供應商。若設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - `agents.defaults.videoGenerationModel` 由共用影片生成能力使用。若省略，`video_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，然後依供應商 ID 順序嘗試其餘已註冊的影片生成供應商。若設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - 每個代理的預設值可透過 `agents.list[].model` 加上繫結覆寫 `agents.defaults.model`（請參閱[多代理路由](/zh-TW/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 選擇來源與 fallback 行為

同一個 `provider/model` 可能因來源不同而代表不同意義：

- 已設定的預設值（`agents.defaults.model.primary` 和代理專屬主要模型）是一般起點，並使用 `agents.defaults.model.fallbacks`。
- 自動 fallback 選擇是暫時復原狀態。它們會以 `modelOverrideSource: "auto"` 儲存，讓後續輪次可以持續使用 fallback 鏈，而不必先探測已知有問題的主要模型。
- 使用者工作階段選擇是精確的。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`；如果選取的供應商/模型無法連線，OpenClaw 會明確失敗，而不是落入另一個已設定模型。
- Cron `--model` / payload `model` 是每個工作的主要模型。它仍會使用已設定的 fallback，除非工作提供明確的 payload `fallbacks`（使用 `fallbacks: []` 可進行嚴格的 cron 執行）。
- CLI default-model 和 allowlist 選擇器會尊重 `models.mode: "replace"`，列出明確的 `models.providers.*.models`，而不是載入完整內建目錄。
- Control UI 模型選擇器會向 Gateway 要求其已設定的模型檢視：若存在則使用 `agents.defaults.models`，包含供應商範圍的 `provider/*` 項目；否則使用明確的 `models.providers.*.models` 加上具有可用驗證的供應商。完整內建目錄只保留給明確瀏覽檢視，例如帶有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型政策

- 將主要模型設為你可用的最強最新世代模型。
- 對成本/延遲敏感的工作和較低風險的聊天使用 fallback。
- 對啟用工具的代理或不受信任的輸入，避免使用較舊/較弱的模型層級。

## Onboarding（建議）

如果你不想手動編輯設定，請執行 onboarding：

```bash
openclaw onboard
```

它可以為常見供應商設定模型與驗證，包括 **OpenAI Code (Codex) subscription**（OAuth）和 **Anthropic**（API 金鑰或 Claude CLI）。

## 設定鍵（概覽）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（allowlist + 別名 + 供應商參數 + `provider/*` 動態供應商項目）
- `models.providers`（寫入 `models.json` 的自訂供應商）

<Note>
模型參照會正規化為小寫。像 `z.ai/*` 這樣的供應商別名會正規化為 `zai/*`。

供應商設定範例（包含 OpenCode）位於 [OpenCode](/zh-TW/providers/opencode)。
</Note>

### 安全編輯 allowlist

手動更新 `agents.defaults.models` 時，請使用增量寫入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆寫保護規則">
    `openclaw config set` 會保護模型/供應商對應，避免意外覆寫。若對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 指派純物件會移除現有項目，該操作會被拒絕。使用 `--merge` 進行增量變更；只有在提供的值應成為完整目標值時才使用 `--replace`。

    互動式供應商設定和 `openclaw configure --section model` 也會將供應商範圍的選擇合併到現有 allowlist，因此新增 Codex、Ollama 或其他供應商不會刪除無關的模型項目。重新套用供應商驗證時，Configure 會保留現有的 `agents.defaults.model.primary`。明確設定預設值的命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍會取代 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## 「Model is not allowed」（以及為什麼回覆會停止）

如果設定了 `agents.defaults.models`，它會成為 `/model` 和工作階段覆寫的 **allowlist**。當使用者選擇不在該 allowlist 中的模型時，OpenClaw 會回傳：

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
這會在一般回覆產生**之前**發生，因此訊息可能讓人覺得它「沒有回應」。修正方式是擇一：

- 將模型加入 `agents.defaults.models`，或
- 清除 allowlist（移除 `agents.defaults.models`），或
- 從 `/model list` 選取模型。

</Warning>

當被拒絕的命令包含執行環境覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正 allowlist，再重試相同的 `/model ... --runtime ...` 命令。對於原生 Codex 執行，選取的模型仍是 `openai/gpt-5.5`；`codex` 執行環境會選擇 harness，並另外使用 Codex 驗證。

對於本機/GGUF 模型，請將完整的供應商前綴參照儲存在 allowlist 中，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 顯示的精確供應商/模型。
當 allowlist 啟用時，只有本機檔名或顯示名稱並不足夠。

如果你想限制供應商，而不想手動列出每個模型，請將
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

使用該政策時，`/model`、`/models` 和模型選擇器只會顯示這些供應商的已探索
目錄。來自所選供應商的新模型可以不編輯 allowlist 就出現。需要從另一個供應商指定一個特定模型時，可以混用精確的 `provider/model` 項目
和 `provider/*` 項目。

allowlist 設定範例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
    - `/model`（和 `/model list`）是一個精簡的編號選擇器（模型家族 + 可用供應商）。
    - 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含供應商和模型下拉選單以及提交步驟。
    - 在 Telegram 上，`/models` 選擇器選項是工作階段範圍；它們不會變更 `openclaw.json` 中代理的持久預設值。
    - `/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。
    - `/model <#>` 會從該選擇器中選取。

  </Accordion>
  <Accordion title="持久化與即時切換">
    - `/model` 會立即持久化新的工作階段選擇。
    - 如果代理閒置，下一次執行會立刻使用新模型。
    - 如果執行已在進行中，OpenClaw 會將即時切換標記為待處理，並只會在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理切換可能會保持排隊，直到之後的重試機會或下一個使用者輪次。
    - 使用者選取的 `/model` 參照對該工作階段是嚴格的：如果選取的供應商/模型無法連線，回覆會明確失敗，而不是默默從 `agents.defaults.model.fallbacks` 回答。這不同於已設定的預設值和 cron 工作主要模型，後者仍可使用 fallback 鏈。
    - `/model status` 是詳細檢視（驗證候選項，以及在已設定時顯示供應商端點 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="Ref parsing">
    - 模型參照會依照**第一個** `/` 分割。輸入 `/model <ref>` 時請使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 風格），你必須包含提供者前綴（範例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略提供者，OpenClaw 會依照下列順序解析輸入：
      1. 別名相符
      2. 該確切未加前綴模型 ID 的唯一已設定提供者相符
      3. 已棄用的後援：回退到已設定的預設提供者 — 如果該提供者不再公開已設定的預設模型，OpenClaw 會改為回退到第一個已設定的提供者/模型，以避免顯示過時且已移除提供者的預設值。
  </Accordion>
</AccordionGroup>

完整指令行為/設定：[斜線指令](/zh-TW/tools/slash-commands)。

## CLI 指令

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

`openclaw models`（沒有子指令）是 `models status` 的捷徑。

### `models list`

預設顯示已設定/可用認證的模型。實用旗標：

<ParamField path="--all" type="boolean">
  完整目錄。包含設定認證之前，由隨附提供者擁有的靜態目錄列，因此僅供探索的檢視可以顯示在你加入相符提供者憑證之前無法使用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  僅限本機提供者。
</ParamField>
<ParamField path="--provider <id>" type="string">
  依提供者 ID 篩選，例如 `moonshot`。不接受互動式選擇器中的顯示標籤。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一個模型。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出。
</ParamField>

### `models status`

顯示已解析的主要模型、後援、圖片模型，以及已設定提供者的認證概覽。它也會顯示在認證儲存區中找到的設定檔 OAuth 到期狀態（預設會在 24 小時內警告）。`--plain` 只會列印已解析的主要模型。

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - OAuth 狀態一律會顯示（也會包含在 `--json` 輸出中）。如果已設定的提供者沒有憑證，`models status` 會列印 **Missing auth** 區段。
    - JSON 包含 `auth.oauth`（警告視窗 + 設定檔）與 `auth.providers`（每個提供者的有效認證，包含由環境支援的憑證）。`auth.oauth` 只代表認證儲存區設定檔健康狀態；僅使用環境的提供者不會出現在其中。
    - 自動化請使用 `--check`（缺少/已到期時結束碼為 `1`，即將到期時為 `2`）。
    - 即時認證檢查請使用 `--probe`；探測列可以來自認證設定檔、環境憑證或 `models.json`。
    - 如果明確的 `auth.order.<provider>` 省略了已儲存的設定檔，探測會回報 `excluded_by_auth_order`，而不是嘗試使用它。如果認證存在，但無法為該提供者解析出可探測的模型，探測會回報 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
認證選擇取決於提供者/帳戶。對於常駐 Gateway 主機，API 金鑰通常最可預期；也支援 Claude CLI 重用與既有的 Anthropic OAuth/權杖設定檔。
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
  提供者前綴篩選。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  後援清單大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  將 `agents.defaults.model.primary` 設為第一個選取項目。
</ParamField>
<ParamField path="--set-image" type="boolean">
  將 `agents.defaults.imageModel.primary` 設為第一個圖片選取項目。
</ParamField>

<Note>
OpenRouter `/models` 目錄是公開的，因此僅中繼資料掃描可以在沒有金鑰的情況下列出免費候選項目。探測與推論仍需要 OpenRouter API 金鑰（來自認證設定檔或 `OPENROUTER_API_KEY`）。如果沒有可用金鑰，`openclaw models scan` 會回退到僅中繼資料輸出，並讓設定保持不變。使用 `--no-probe` 可明確要求僅中繼資料模式。
</Note>

掃描結果排序依據：

1. 圖片支援
2. 工具延遲
3. 上下文大小
4. 參數數量

輸入：

- OpenRouter `/models` 清單（篩選 `:free`）
- 即時探測需要來自認證設定檔或 `OPENROUTER_API_KEY` 的 OpenRouter API 金鑰（請參閱[環境變數](/zh-TW/help/environment)）
- 選用篩選條件：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 要求/探測控制：`--timeout`、`--concurrency`

當即時探測在 TTY 中執行時，你可以互動式選擇後援。在非互動模式中，傳入 `--yes` 以接受預設值。僅中繼資料結果僅供參考；`--set-default` 和 `--set-image` 需要即時探測，讓 OpenClaw 不會設定無法使用且無金鑰的 OpenRouter 模型。

## 模型登錄檔（`models.json`）

`models.providers` 中的自訂提供者會寫入代理目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 設為 `replace`，否則此檔案預設會合併。

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    相符提供者 ID 的合併模式優先順序：

    - 代理 `models.json` 中已存在的非空 `baseUrl` 優先。
    - 代理 `models.json` 中的非空 `apiKey` 只有在該提供者於目前設定/認證設定檔情境中不是由 SecretRef 管理時才優先。
    - SecretRef 管理的提供者 `apiKey` 值會從來源標記重新整理（環境參照為 `ENV_VAR_NAME`，檔案/執行參照為 `secretref-managed`），而不是保存已解析的秘密。
    - SecretRef 管理的提供者標頭值會從來源標記重新整理（環境參照為 `secretref-env:ENV_VAR_NAME`，檔案/執行參照為 `secretref-managed`）。
    - 空白或缺少的代理 `apiKey`/`baseUrl` 會回退到設定 `models.providers`。
    - 其他提供者欄位會從設定與正規化的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

<Note>
標記保存以來源為權威：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段秘密值寫入。這適用於 OpenClaw 重新產生 `models.json` 的任何情況，包含像 `openclaw agent` 這類由指令驅動的路徑。
</Note>

## 相關

- [代理執行階段](/zh-TW/concepts/agent-runtimes) — PI、Codex 與其他代理迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [圖片生成](/zh-TW/tools/image-generation) — 圖片模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 後援鏈
- [模型提供者](/zh-TW/concepts/model-providers) — 提供者路由與認證
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
