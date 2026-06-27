---
read_when:
    - 新增或修改模型命令列介面（models list/set/scan/aliases/fallbacks）
    - 變更模型備援行為或選擇使用者體驗
    - 更新模型掃描探測（工具/圖片）
sidebarTitle: Models CLI
summary: 模型命令列介面：列出、設定、別名、備援、掃描、狀態
title: 模型命令列介面
x-i18n:
    generated_at: "2026-06-27T19:12:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    驗證設定檔輪替、冷卻時間，以及其如何與後援互動。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers">
    快速供應商概覽與範例。
  </Card>
  <Card title="代理執行階段" href="/zh-TW/concepts/agent-runtimes">
    OpenClaw、Codex，以及其他代理迴圈執行階段。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵。
  </Card>
</CardGroup>

模型參照會選擇供應商和模型。它們通常不會選擇低階代理執行階段。OpenAI 代理參照是主要例外：在官方 OpenAI 供應商上，`openai/gpt-5.5` 預設會透過 Codex app-server 執行階段執行。訂閱 Copilot 參照（`github-copilot/*`）還可以選擇加入外部 GitHub Copilot 代理執行階段外掛 — 該路徑保持明確（沒有 `auto` 後援）。明確的執行階段覆寫屬於供應商/模型政策，而不是整個代理或工作階段。在 Codex 執行階段模式中，`openai/gpt-*` 參照並不表示 API 金鑰計費；驗證可以來自 Codex 帳戶或 `openai` OAuth 設定檔。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)和 [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## 模型選擇如何運作

OpenClaw 會依此順序選擇模型：

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或 `agents.defaults.model`）。
  </Step>
  <Step title="後援">
    `agents.defaults.model.fallbacks`（依順序）。
  </Step>
  <Step title="供應商驗證容錯移轉">
    驗證容錯移轉會先在供應商內發生，再移至下一個模型。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="相關模型介面">
    - `agents.defaults.models` 是 OpenClaw 可使用的模型允許清單/型錄（加上別名）。使用 `provider/*` 項目可限制可見供應商，同時保留動態供應商探索。
    - `agents.defaults.imageModel` **只有在**主要模型無法接受圖片時使用。
    - `agents.defaults.pdfModel` 由 `pdf` 工具使用。若省略，該工具會退回到 `agents.defaults.imageModel`，再退回到解析後的工作階段/預設模型。
    - `agents.defaults.imageGenerationModel` 由共用圖片產生能力使用。若省略，`image_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的圖片產生供應商。如果設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - `agents.defaults.musicGenerationModel` 由共用音樂產生能力使用。若省略，`music_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的音樂產生供應商。如果設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - `agents.defaults.videoGenerationModel` 由共用影片產生能力使用。若省略，`video_generate` 仍可推斷有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的影片產生供應商。如果設定特定供應商/模型，也請設定該供應商的驗證/API 金鑰。
    - 每個代理的預設值可透過 `agents.list[].model` 加上繫結覆寫 `agents.defaults.model`（請參閱[多代理路由](/zh-TW/concepts/multi-agent)）。

  </Accordion>
</AccordionGroup>

## 選擇來源與後援行為

相同的 `provider/model` 可能因來源不同而代表不同意義：

- 已設定的預設值（`agents.defaults.model.primary` 和代理專屬主要模型）是一般起點，並使用 `agents.defaults.model.fallbacks`。
- 自動後援選擇是暫時的復原狀態。它們會以 `modelOverrideSource: "auto"` 儲存，讓後續回合能繼續使用後援鏈，而不必每次探測已知不良的主要模型；OpenClaw 會定期再次探測原始主要模型，在其復原時清除自動選擇，並且每次狀態變更只公告一次後援/復原轉換。
- 使用者工作階段選擇是精確的。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`；如果所選供應商/模型無法連線，OpenClaw 會明確失敗，而不是落到另一個已設定模型。
- 變更 `agents.defaults.model.primary` 不會重寫現有工作階段選擇。如果狀態顯示 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，請用 `/model default` 清除目前工作階段選擇，讓它再次繼承已設定的主要模型。
- Cron `--model` / 承載 `model` 是每個工作的主要模型。除非工作提供明確承載 `fallbacks`，否則仍會使用已設定的後援（使用 `fallbacks: []` 可執行嚴格的排程工作）。
- 命令列介面 預設模型和允許清單選擇器會遵循 `models.mode: "replace"`，列出明確的 `models.providers.*.models`，而不是載入完整內建型錄。
- Control UI 模型選擇器會向閘道要求其已設定模型檢視：存在時使用 `agents.defaults.models`，包含供應商範圍的 `provider/*` 項目，否則使用明確的 `models.providers.*.models` 加上具有可用驗證的供應商。完整內建型錄僅保留給明確瀏覽檢視，例如帶有 `view: "all"` 的 `models.list` 或 `openclaw models list --all`。

## 快速模型政策

- 將主要模型設定為你可用的最強最新世代模型。
- 對成本/延遲敏感的工作和較低風險的聊天使用後援。
- 對啟用工具的代理或不受信任的輸入，避免使用較舊/較弱的模型層級。

## 入門設定（建議）

如果你不想手動編輯設定，請執行入門設定：

```bash
openclaw onboard
```

它可以為常見供應商設定模型 + 驗證，包括 **OpenAI Code (Codex) 訂閱**（OAuth）和 **Anthropic**（API 金鑰或 Claude 命令列介面）。

## 設定鍵（概覽）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 和 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 和 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 和 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（允許清單 + 別名 + 供應商參數 + `provider/*` 動態供應商項目）
- `models.providers`（寫入 `models.json` 的自訂供應商）

<Note>
模型參照會正規化為小寫。除此之外，供應商 ID 會精確比對；請使用外掛公布的
供應商 ID。

供應商設定範例（包括 OpenCode）位於 [OpenCode](/zh-TW/providers/opencode)。
</Note>

### 安全的允許清單編輯

手動更新 `agents.defaults.models` 時，請使用加成式寫入：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="覆寫保護規則">
    `openclaw config set` 會保護模型/供應商對應，避免意外覆寫。對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的普通物件指定，在會移除現有項目時會被拒絕。使用 `--merge` 進行加成式變更；只有在提供的值應成為完整目標值時才使用 `--replace`。

    互動式供應商設定和 `openclaw configure --section model` 也會將供應商範圍的選擇合併到現有允許清單，因此新增 Codex、Ollama 或其他供應商不會移除不相關的模型項目。重新套用供應商驗證時，Configure 會保留現有的 `agents.defaults.model.primary`。明確設定預設值的命令，例如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>`，仍會取代 `agents.defaults.model.primary`。

  </Accordion>
</AccordionGroup>

## 「模型不被允許」（以及為何回覆停止）

如果設定了 `agents.defaults.models`，它會成為 `/model` 和工作階段覆寫的**允許清單**。當使用者選擇不在該允許清單中的模型時，OpenClaw 會傳回：

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
這會在產生一般回覆**之前**發生，因此訊息可能會讓人覺得它「沒有回應」。修正方式是擇一：

- 將模型加入 `agents.defaults.models`，或
- 清除允許清單（移除 `agents.defaults.models`），或
- 從 `/model list` 選擇模型。

</Warning>

當被拒絕的命令包含執行階段覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正允許清單，再重試相同的 `/model ... --runtime ...` 命令。對於原生 Codex 執行，所選模型仍是 `openai/gpt-5.5`；`codex` 執行階段會選擇 harness，並另行使用 Codex 驗證。

對於本機/GGUF 模型，請將完整的供應商前綴參照存入允許清單，
例如 `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`，或
`openclaw models list --provider <provider>` 顯示的精確供應商/模型。
允許清單啟用時，只有本機檔名或顯示名稱是不夠的。

如果你想限制供應商而不手動列出每個模型，請將
`provider/*` 項目加入 `agents.defaults.models`：

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

使用該政策時，`/model`、`/models` 和模型選擇器只會顯示那些供應商的已探索
型錄。所選供應商的新模型可以在不編輯允許清單的情況下
出現。當你需要另一個供應商的一個特定模型時，可以將精確的 `provider/model` 項目
與 `provider/*` 項目混用。

允許清單設定範例：

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

你可以在不重新啟動的情況下，為目前工作階段切換模型：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="選擇器行為">
    - `/model`（和 `/model list`）是精簡的編號選擇器（模型家族 + 可用供應商）。
    - 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含供應商和模型下拉選單，以及提交步驟。
    - 在 Telegram 上，`/models` 選擇器選項作用於工作階段範圍；它們不會變更 `openclaw.json` 中代理的持久預設值。
    - `/models add` 已棄用，現在會傳回棄用訊息，而不是從聊天註冊模型。
    - `/model <#>` 會從該選擇器中選擇。

  </Accordion>
  <Accordion title="持久化與即時切換">
    - `/model` 會立即持久化新的工作階段選擇。
    - 如果代理程式閒置中，下一次執行會立刻使用新模型。
    - 如果已有執行正在進行，OpenClaw 會將即時切換標記為待處理，並只會在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理的切換可能會持續排入佇列，直到之後的重試機會或下一次使用者回合。
    - `/model default` 會清除工作階段選擇，並讓工作階段回到已設定的預設模型。
    - 使用者選取的 `/model` ref 對該工作階段是嚴格的：如果選取的供應商/模型無法連線，回覆會明確失敗，而不是默默從 `agents.defaults.model.fallbacks` 回答。這不同於已設定的預設值與排程工作主要模型，它們仍可使用備援鏈。
    - `/model status` 是詳細檢視（驗證候選項，以及設定時的供應商端點 `baseUrl` + `api` 模式）。

  </Accordion>
  <Accordion title="Ref 解析">
    - 模型 ref 會依照**第一個** `/` 分割來解析。輸入 `/model <ref>` 時請使用 `provider/model`。
    - 如果模型 ID 本身包含 `/`（OpenRouter 風格），你必須包含供應商前綴（例如：`/model openrouter/moonshotai/kimi-k2`）。
    - 如果省略供應商，OpenClaw 會依此順序解析輸入：
      1. 別名相符
      2. 該精確未加前綴模型 ID 的唯一已設定供應商相符項
      3. 已棄用的備援至已設定的預設供應商 — 如果該供應商不再公開已設定的預設模型，OpenClaw 會改為退回第一個已設定的供應商/模型，以避免浮現已移除供應商的過時預設值。
  </Accordion>
</AccordionGroup>

完整指令行為/設定：[斜線指令](/zh-TW/tools/slash-commands)。

## 命令列介面指令

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

預設顯示已設定/驗證可用的模型。實用旗標：

<ParamField path="--all" type="boolean">
  完整目錄。包含在設定驗證之前由內建供應商擁有的靜態目錄列，因此僅探索的檢視可以顯示在加入相符供應商憑證之前無法使用的模型。
</ParamField>
<ParamField path="--local" type="boolean">
  僅限本機供應商。
</ParamField>
<ParamField path="--provider <id>" type="string">
  依供應商 id 篩選，例如 `moonshot`。互動式選擇器中的顯示標籤不會被接受。
</ParamField>
<ParamField path="--plain" type="boolean">
  每行一個模型。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出。
</ParamField>

### `models status`

顯示已解析的主要模型、備援、圖片模型，以及已設定供應商的驗證概覽。它也會顯示在驗證儲存區中找到之設定檔的 OAuth 到期狀態（預設在 24 小時內警告）。`--plain` 只會列印已解析的主要模型。

<AccordionGroup>
  <Accordion title="驗證與探測行為">
    - OAuth 狀態一律顯示（並包含在 `--json` 輸出中）。如果已設定的供應商沒有憑證，`models status` 會列印 **缺少驗證** 區段。
    - JSON 包含 `auth.oauth`（警告視窗 + 設定檔）與 `auth.providers`（每個供應商的有效驗證，包括由環境變數支援的憑證）。`auth.oauth` 只代表驗證儲存區設定檔健康狀態；僅環境變數供應商不會出現在其中。
    - 使用 `--check` 進行自動化（缺少/已到期時結束 `1`，即將到期時結束 `2`）。
    - 使用 `--probe` 進行即時驗證檢查；探測列可來自驗證設定檔、環境變數憑證或 `models.json`。
    - 如果明確的 `auth.order.<provider>` 省略了已儲存的設定檔，探測會回報 `excluded_by_auth_order` 而不是嘗試它。如果驗證存在但無法為該供應商解析可探測模型，探測會回報 `status: no_model`。

  </Accordion>
</AccordionGroup>

<Note>
驗證選擇取決於供應商/帳戶。對於永遠開啟的閘道主機，API 金鑰通常最可預測；也支援 Claude 命令列介面重用以及既有的 Anthropic OAuth/token 設定檔。
</Note>

範例（Claude 命令列介面）：

```bash
claude auth login
openclaw models status
```

## 掃描（OpenRouter 免費模型）

`openclaw models scan` 會檢查 OpenRouter 的**免費模型目錄**，並可選擇探測模型的工具與圖片支援。

<ParamField path="--no-probe" type="boolean">
  略過即時探測（僅中繼資料）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小參數大小（十億）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  略過較舊模型。
</ParamField>
<ParamField path="--provider <name>" type="string">
  供應商前綴篩選器。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  備援清單大小。
</ParamField>
<ParamField path="--set-default" type="boolean">
  將 `agents.defaults.model.primary` 設為第一個選項。
</ParamField>
<ParamField path="--set-image" type="boolean">
  將 `agents.defaults.imageModel.primary` 設為第一個圖片選項。
</ParamField>

<Note>
OpenRouter `/models` 目錄是公開的，因此僅中繼資料掃描可以在沒有金鑰的情況下列出免費候選項。探測與推論仍需要 OpenRouter API 金鑰（來自驗證設定檔或 `OPENROUTER_API_KEY`）。如果沒有可用金鑰，`openclaw models scan` 會退回僅中繼資料輸出，並保持設定不變。使用 `--no-probe` 明確要求僅中繼資料模式。
</Note>

掃描結果依下列排序：

1. 圖片支援
2. 工具延遲
3. 上下文大小
4. 參數數量

輸入：

- OpenRouter `/models` 清單（篩選 `:free`）
- 即時探測需要來自驗證設定檔或 `OPENROUTER_API_KEY` 的 OpenRouter API 金鑰（請參閱[環境變數](/zh-TW/help/environment)）
- 選用篩選器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 要求/探測控制：`--timeout`、`--concurrency`

當即時探測在 TTY 中執行時，你可以互動式選取備援。在非互動模式中，傳入 `--yes` 以接受預設值。僅中繼資料結果僅供參考；`--set-default` 與 `--set-image` 需要即時探測，因此 OpenClaw 不會設定無法使用的無金鑰 OpenRouter 模型。

## 模型登錄檔（`models.json`）

`models.providers` 中的自訂供應商會寫入代理程式目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。供應商外掛目錄會作為產生的外掛擁有目錄分片，儲存在代理程式的外掛狀態下並自動載入。除非 `models.mode` 設為 `replace`，否則預設會合併此檔案。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    相符供應商 ID 的合併模式優先順序：

    - 代理程式 `models.json` 中已存在的非空 `baseUrl` 勝出。
    - 代理程式 `models.json` 中的非空 `apiKey` 只有在該供應商未於目前設定/驗證設定檔上下文中由 SecretRef 管理時才勝出。
    - 由 SecretRef 管理的供應商 `apiKey` 值會從來源標記重新整理（環境變數 ref 使用 `ENV_VAR_NAME`，file/exec ref 使用 `secretref-managed`），而不是持久化已解析的密鑰。
    - 由 SecretRef 管理的供應商標頭值會從來源標記重新整理（環境變數 ref 使用 `secretref-env:ENV_VAR_NAME`，file/exec ref 使用 `secretref-managed`）。
    - 空白或缺少的代理程式 `apiKey`/`baseUrl` 會退回設定 `models.providers`。
    - 其他供應商欄位會從設定與正規化目錄資料重新整理。

  </Accordion>
</AccordionGroup>

<Note>
標記持久化以來源為準：OpenClaw 會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段密鑰值寫入。這適用於 OpenClaw 重新產生 `models.json` 的所有情況，包括像 `openclaw agent` 這類由指令驅動的路徑。
</Note>

## 相關

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes) — OpenClaw、Codex 與其他代理程式迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [圖片生成](/zh-TW/tools/image-generation) — 圖片模型設定
- [模型故障轉移](/zh-TW/concepts/model-failover) — 備援鏈
- [模型供應商](/zh-TW/concepts/model-providers) — 供應商路由與驗證
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
