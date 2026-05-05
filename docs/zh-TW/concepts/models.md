---
read_when:
    - 新增或修改模型 CLI（models list/set/scan/aliases/fallbacks）
    - 變更模型備援行為或選擇體驗
    - 更新模型掃描探針（工具/圖片）
sidebarTitle: Models CLI
summary: 模型 CLI：列出、設定、別名、備援、掃描、狀態
title: 模型 CLI
x-i18n:
    generated_at: "2026-05-05T01:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    Auth 設定檔輪替、冷卻時間，以及這如何與備援互動。
  </Card>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers">
    快速的提供者概覽和範例。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent-runtimes">
    PI、Codex 和其他代理迴圈執行階段。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵。
  </Card>
</CardGroup>

模型 ref 會選擇提供者和模型。它們通常不會選擇低階代理執行階段。例如，`openai/gpt-5.5` 可以透過一般 OpenAI 提供者路徑執行，也可以透過 Codex app-server 執行階段執行，取決於 `agents.defaults.agentRuntime.id`。在 Codex 執行階段模式中，`openai/gpt-*` ref 不代表 API 金鑰計費；Auth 可以來自 Codex 帳戶或 `openai-codex` Auth 設定檔。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)。

## 模型選擇如何運作

OpenClaw 會依照下列順序選擇模型：

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="備援">
    `agents.defaults.model.fallbacks`（依序）。
  </Step>
  <Step title="提供者 Auth 容錯移轉">
    Auth 容錯移轉會在移至下一個模型之前，於提供者內部發生。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相關模型介面">
    - `agents.defaults.models` 是 OpenClaw 可使用模型的允許清單/目錄（加上別名）。
    - `agents.defaults.imageModel` **只會在**主要模型無法接受影像時使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。如果省略，工具會退回到 `agents.defaults.imageModel`，接著退回到解析後的工作階段/預設模型。
    - `agents.defaults.imageGenerationModel` 由共用的影像生成能力使用。如果省略，`image_generate` 仍可推斷由 Auth 支援的提供者預設值。它會先嘗試目前的預設提供者，然後依 provider-id 順序嘗試其餘已註冊的影像生成提供者。如果你設定特定提供者/模型，也請設定該提供者的 Auth/API 金鑰。
    - `agents.defaults.musicGenerationModel` 由共用的音樂生成能力使用。如果省略，`music_generate` 仍可推斷由 Auth 支援的提供者預設值。它會先嘗試目前的預設提供者，然後依 provider-id 順序嘗試其餘已註冊的音樂生成提供者。如果你設定特定提供者/模型，也請設定該提供者的 Auth/API 金鑰。
    - `agents.defaults.videoGenerationModel` 由共用的影片生成能力使用。如果省略，`video_generate` 仍可推斷由 Auth 支援的提供者預設值。它會先嘗試目前的預設提供者，然後依 provider-id 順序嘗試其餘已註冊的影片生成提供者。如果你設定特定提供者/模型，也請設定該提供者的 Auth/API 金鑰。
    - 每個代理的預設值可以透過 `agents.list[].model` 加上繫結覆寫 `agents.defaults.model`（請參閱[多代理路由](/zh-TW/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 選擇來源與備援行為

相同的 `provider/model` 可能會依其來源代表不同含義：

- 已設定的預設值（`agents.defaults.model.primary` 和代理專屬主要模型）是一般起點，並使用 `agents.defaults.model.fallbacks`。
- 自動備援選擇是暫時復原狀態。它們會以 `modelOverrideSource: "auto"` 儲存，讓後續回合能繼續使用備援鏈，而不必先探測已知有問題的主要模型。
- 使用者工作階段選擇是精確的。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`；如果該選取的提供者/模型無法連線，OpenClaw 會明確失敗，而不是落入另一個已設定的模型。
- Cron `--model` / payload `model` 是每個工作的主要模型。除非工作提供明確的 payload `fallbacks`，否則它仍會使用已設定的備援（若要嚴格執行 cron，請使用 `fallbacks: []`）。
- CLI 預設模型和允許清單選擇器會遵守 `models.mode: "replace"`，列出明確的 `models.providers.*.models`，而不是載入完整的內建目錄。
- Control UI 模型選擇器會向 Gateway 詢問其已設定的模型檢視：存在時使用 `agents.defaults.models`，否則使用明確的 `models.providers.*.models` 加上具有可用 Auth 的提供者。完整內建目錄保留給明確瀏覽檢視，例如含有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型政策

- 將主要模型設定為你可用的最強最新世代模型。
- 對成本/延遲敏感任務和較低風險聊天使用備援。
- 對於啟用工具的代理或不受信任的輸入，避免使用較舊/較弱的模型層級。

## 入門設定（建議）

如果你不想手動編輯設定，請執行入門設定：

```bash
openclaw onboard
```

它可以為常見提供者設定模型 + Auth，包括 **OpenAI Code (Codex) 訂閱**（OAuth）和 **Anthropic**（API 金鑰或 Claude CLI）。

## 設定鍵（概覽）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允許清單 + 別名 + 提供者參數）
- `models.providers`（寫入 `models.json` 的自訂提供者）

<Note>
模型 ref 會正規化為小寫。像 `z.ai/*` 這類提供者別名會正規化為 `zai/*`。

提供者設定範例（包括 OpenCode）位於 [OpenCode](/zh-TW/providers/opencode)。
</Note>

### 安全的允許清單編輯

手動更新 `agents.defaults.models` 時，請使用加法寫入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆蓋保護規則">
    `openclaw config set` 會保護模型/提供者映射，避免意外覆蓋。對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 進行一般物件指派時，如果會移除現有項目，就會遭到拒絕。加法變更請使用 `--merge`；只有在提供的值應成為完整目標值時才使用 `--replace`。

    互動式提供者設定和 `openclaw configure --section model` 也會將提供者範圍的選擇合併到現有允許清單，因此新增 Codex、Ollama 或其他提供者不會移除不相關的模型項目。重新套用提供者 Auth 時，Configure 會保留現有的 `agents.defaults.model.primary`。明確設定預設值的命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍會取代 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## 「模型不被允許」（以及回覆停止的原因）

如果已設定 `agents.defaults.models`，它會成為 `/model` 和工作階段覆寫的**允許清單**。當使用者選擇不在該允許清單中的模型時，OpenClaw 會回傳：

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
這會在產生一般回覆**之前**發生，因此訊息可能感覺像是「沒有回應」。修正方式是下列其中之一：

- 將模型新增到 `agents.defaults.models`，或
- 清除允許清單（移除 `agents.defaults.models`），或
- 從 `/model list` 選擇模型。

</Warning>

當被拒絕的命令包含執行階段覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正允許清單，然後重試相同的 `/model ... --runtime ...` 命令。對於原生 Codex 執行，選取的模型仍是 `openai/gpt-5.5`；`codex` 執行階段會選擇 harness，並另外使用 Codex Auth。

對於本機/GGUF 模型，請將完整的 provider-prefixed ref 儲存在允許清單中，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 顯示的
確切 provider/model。當允許清單啟用時，單獨的本機檔名或顯示名稱並不足夠。

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

## 在聊天中切換模型 (`/model`)

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
    - `/model`（和 `/model list`）是精簡的編號選擇器（模型家族 + 可用提供者）。
    - 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，其中包含提供者和模型下拉選單，以及提交步驟。
    - 在 Telegram 上，`/models` 選擇器的選取項目只限於工作階段；它們不會變更 `openclaw.json` 中代理的持久預設值。
    - `/models add` 已淘汰，現在會回傳淘汰訊息，而不是從聊天註冊模型。
    - `/model <#>` 會從該選擇器中選取。

  </Accordion>
  <Accordion title="持久性與即時切換">
    - `/model` 會立即保存新的工作階段選擇。
    - 如果代理閒置，下一次執行會立刻使用新模型。
    - 如果已有執行正在進行，OpenClaw 會將即時切換標記為待處理，並只會在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理的切換可能會保持佇列狀態，直到稍後的重試機會或下一個使用者回合。
    - 使用者選取的 `/model` ref 對該工作階段是嚴格的：如果選取的提供者/模型無法連線，回覆會明確失敗，而不是默默從 `agents.defaults.model.fallbacks` 回答。這不同於已設定的預設值和 cron 工作主要模型，後者仍可使用備援鏈。
    - `/model status` 是詳細檢視（Auth 候選項，以及設定時的提供者端點 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="Ref 解析">
    - 模型 ref 會透過**第一個** `/` 分割來解析。輸入 `/model <ref>` 時請使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 風格），你必須包含提供者前綴（範例：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略提供者，OpenClaw 會依下列順序解析輸入：
      1. 別名相符
      2. 該確切未加前綴模型 ID 的唯一已設定提供者相符
      3. 已淘汰的退回到已設定預設提供者 — 如果該提供者不再公開已設定的預設模型，OpenClaw 會改為退回到第一個已設定的 provider/model，以避免顯示過時的已移除提供者預設值。
  </Accordion>
</AccordionGroup>

完整命令行為/設定：[斜線命令](/zh-TW/tools/slash-commands)。

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

預設顯示已設定／可用驗證的模型。實用旗標：

<ParamField path="--all" type="boolean">
  完整目錄。包含在設定驗證之前由內建提供者擁有的靜態目錄列，因此僅供探索的檢視可以顯示在新增相符提供者憑證之前無法使用的模型。
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

顯示解析後的主要模型、備用模型、影像模型，以及已設定提供者的驗證概覽。它也會揭露驗證儲存區中找到的設定檔 OAuth 到期狀態（預設會在 24 小時內發出警告）。`--plain` 只會列印解析後的主要模型。

<AccordionGroup>
  <Accordion title="驗證與探測行為">
    - OAuth 狀態一律顯示（也包含在 `--json` 輸出中）。如果已設定的提供者沒有憑證，`models status` 會列印 **Missing auth** 區段。
    - JSON 包含 `auth.oauth`（警告視窗 + 設定檔）和 `auth.providers`（每個提供者的有效驗證，包括由環境支援的憑證）。`auth.oauth` 僅是驗證儲存區設定檔健康狀態；僅使用環境變數的提供者不會出現在其中。
    - 將 `--check` 用於自動化（缺少／已到期時結束碼為 `1`，即將到期時為 `2`）。
    - 將 `--probe` 用於即時驗證檢查；探測列可來自驗證設定檔、環境憑證或 `models.json`。
    - 如果明確的 `auth.order.<provider>` 省略已儲存的設定檔，探測會回報 `excluded_by_auth_order`，而不是嘗試它。如果驗證存在，但無法為該提供者解析出可探測的模型，探測會回報 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
驗證選擇取決於提供者／帳戶。對於常駐 Gateway 主機，API 金鑰通常最可預測；也支援重用 Claude CLI 以及現有 Anthropic OAuth／權杖設定檔。
</Note>

範例（Claude CLI）：

```bash
claude auth login
openclaw models status
```

## 掃描（OpenRouter 免費模型）

`openclaw models scan` 會檢查 OpenRouter 的**免費模型目錄**，並可選擇性地探測模型是否支援工具和影像。

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
  提供者前綴篩選器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  備用清單大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  將 `agents.defaults.model.primary` 設為第一個選項。
</ParamField>
<ParamField path="--set-image" type="boolean">
  將 `agents.defaults.imageModel.primary` 設為第一個影像選項。
</ParamField>

<Note>
OpenRouter `/models` 目錄是公開的，因此僅中繼資料掃描可以在沒有金鑰的情況下列出免費候選項目。探測和推論仍需要 OpenRouter API 金鑰（來自驗證設定檔或 `OPENROUTER_API_KEY`）。如果沒有可用金鑰，`openclaw models scan` 會退回為僅中繼資料輸出，並保持設定不變。使用 `--no-probe` 可明確要求僅中繼資料模式。
</Note>

掃描結果排序依據：

1. 影像支援
2. 工具延遲
3. 上下文大小
4. 參數數量

輸入：

- OpenRouter `/models` 清單（篩選 `:free`）
- 即時探測需要來自驗證設定檔或 `OPENROUTER_API_KEY` 的 OpenRouter API 金鑰（請參閱[環境變數](/zh-TW/help/environment)）
- 選用篩選器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 請求／探測控制：`--timeout`、`--concurrency`

當即時探測在 TUI 中執行時，你可以互動式選取備用模型。在非互動模式下，傳入 `--yes` 以接受預設值。僅中繼資料結果僅供參考；`--set-default` 和 `--set-image` 需要即時探測，這樣 OpenClaw 才不會設定無法使用、沒有金鑰的 OpenRouter 模型。

## 模型登錄檔（`models.json`）

`models.providers` 中的自訂提供者會寫入代理目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。除非 `models.mode` 設為 `replace`，否則預設會合併此檔案。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    相符提供者 ID 的合併模式優先順序：

    - 代理 `models.json` 中已存在的非空 `baseUrl` 優先。
    - 只有當該提供者在目前設定／驗證設定檔內容中不是由 SecretRef 管理時，代理 `models.json` 中的非空 `apiKey` 才會優先。
    - 由 SecretRef 管理的提供者 `apiKey` 值會從來源標記重新整理（環境參照為 `ENV_VAR_NAME`，檔案／執行參照為 `secretref-managed`），而不是持久化解析後的祕密。
    - 由 SecretRef 管理的提供者標頭值會從來源標記重新整理（環境參照為 `secretref-env:ENV_VAR_NAME`，檔案／執行參照為 `secretref-managed`）。
    - 空白或缺少的代理 `apiKey`／`baseUrl` 會退回到設定中的 `models.providers`。
    - 其他提供者欄位會從設定和正規化的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

<Note>
標記持久化以來源為權威：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從解析後的執行階段祕密值寫入。這適用於 OpenClaw 重新產生 `models.json` 的所有情況，包括像 `openclaw agent` 這類由命令驅動的路徑。
</Note>

## 相關

- [代理執行階段](/zh-TW/concepts/agent-runtimes) — PI、Codex 和其他代理迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [影像生成](/zh-TW/tools/image-generation) — 影像模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 備用鏈
- [模型提供者](/zh-TW/concepts/model-providers) — 提供者路由與驗證
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
