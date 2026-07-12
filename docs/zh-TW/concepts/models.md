---
read_when:
    - 變更模型備援行為或選擇使用者體驗
    - 偵錯「不允許使用模型」或過時的預設供應商後援機制
    - 處理 models.json 合併／秘密行為
sidebarTitle: Models CLI
summary: OpenClaw 如何解析供應商/模型參照、設定鍵，以及 `/model` 聊天命令
title: 模型命令列介面
x-i18n:
    generated_at: "2026-07-12T14:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    認證設定檔輪替、冷卻時間，以及其與備援模型的互動方式。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers">
    供應商快速概覽與範例。
  </Card>
  <Card title="模型命令列介面參考" href="/zh-TW/cli/models">
    完整的 `openclaw models` 命令與旗標參考。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵、預設值與範例。
  </Card>
</CardGroup>

模型參照（`provider/model`）會選擇供應商與模型，而非底層
代理程式執行階段。當未設定執行階段原則或設為 `auto` 時，OpenAI 供應商所擁有的
路由原則可能只會針對完全相符的官方 HTTPS Platform
Responses 或 ChatGPT Responses 路由選擇 Codex，且要求沒有自行指定的請求覆寫；
僅有 `openai/*` 前綴絕不會選擇 Codex。Completions 轉接器、自訂
端點，以及自行指定的請求行為仍會由 OpenClaw 處理。官方的純文字
HTTP 端點會遭拒絕。請參閱 [OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

訂閱版 Copilot 參照（`github-copilot/*`）可選擇使用外部
GitHub Copilot 代理程式執行階段外掛，但此路徑一律必須明確指定（絕不會
由 `auto` 選取）。執行階段覆寫應設於供應商／模型原則，而非
整個代理程式或工作階段。執行階段選擇不會決定計費方式：
OpenAI API 金鑰與 ChatGPT/Codex 訂閱認證資訊仍彼此獨立。請參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)與
[GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## 選擇順序

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或將 `agents.defaults.model` 設為純字串）。
  </Step>
  <Step title="備援模型">
    `agents.defaults.model.fallbacks`，依序嘗試。
  </Step>
  <Step title="認證容錯移轉">
    OpenClaw 移至下一個備援模型前，會先在供應商內輪替認證設定檔。
  </Step>
</Steps>

相關模型設定介面：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允許清單／目錄，並包含別名。使用 `provider/*` 項目即可允許供應商中所有已探索到的模型，無須逐一列出。
- `agents.defaults.utilityModel` 是選用的低成本模型，用於簡短的內部工作，例如產生儀表板工作階段標題、受支援頻道的討論串／主題標題，以及進度敘述。每個代理程式的 `agents.list[].utilityModel` 會覆寫此設定。未設定時，若主要供應商宣告了小型模型預設值，OpenClaw 便會使用該值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）；否則會使用代理程式的主要模型。將其設為空字串即可停用公用模型路由。公用工作是獨立的模型呼叫，且可能會將有限範圍的工作內容傳送給所選的模型供應商。
- `agents.defaults.imageModel` 僅在主要模型無法接收圖片時使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。若未設定，該工具會依序退回使用 `imageModel`，再使用已解析的工作階段／預設模型。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel` 和 `videoGenerationModel` 支援共用媒體產生工具。若未設定，每個工具會推斷具認證支援的供應商預設值：先使用目前的預設供應商，再依供應商 ID 順序使用其餘已註冊且支援該功能的供應商。設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可停用此跨供應商推斷，同時保留明確指定的備援模型。
- 每個代理程式的 `agents.list[].model`（加上繫結）會覆寫 `agents.defaults.model` — 請參閱[多代理程式路由](/zh-TW/concepts/multi-agent)。

完整設定鍵參考、預設值與 JSON5 範例：[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 選擇來源與備援嚴格程度

相同的 `provider/model` 會因其來源而有不同的行為：

| 來源                                                                    | 行為                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已設定的預設值（`agents.defaults.model.primary`、每個代理程式的主要模型） | 一般起始點；使用 `agents.defaults.model.fallbacks`。                                                                                                                                                                                                            |
| 自動備援                                                                | 暫時復原狀態，儲存為 `modelOverrideSource: "auto"`。OpenClaw 會定期重新探測原始主要模型，在恢復時清除自動選擇，並在每次狀態變更時宣告一次備援／復原轉換。                                                                                                         |
| 使用者工作階段選擇                                                      | 精確且嚴格。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`。如果該供應商／模型無法連線，執行會明確失敗，而不會繼續退回使用另一個已設定的模型。 |
| 排程 `--model`／承載資料 `model`                                        | 每項工作的主要模型。除非工作提供自己的承載資料 `fallbacks`，否則仍會使用已設定的備援模型（`fallbacks: []` 會強制嚴格執行）。                                                                                                                                    |

其他選擇規則：

- 變更 `agents.defaults.model.primary` 不會改寫現有的工作階段固定設定。如果狀態回報 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，請執行 `/model default` 清除固定設定。
- 當 `models.mode: "replace"` 時，命令列介面的預設模型與允許清單選擇器只會列出 `models.providers.*.models`，而非完整的內建目錄。
- Control UI 模型選擇器會向閘道要求其已設定的模型檢視：若有設定 `agents.defaults.models`，便使用該設定（包括 `provider/*` 萬用字元項目）；否則使用 `models.providers.*.models`，再加上具有可用認證的供應商。完整的內建目錄僅供明確瀏覽檢視使用（`models.list` 搭配 `view: "all"`，或 `openclaw models list --all`）。
- 供應商清單使用者介面會使用搭配 `view: "provider-config"` 的 `models.list`，顯示來源所指定的 `models.providers.*.models` 資料列，而不套用選擇器允許清單。

完整機制：[模型容錯移轉](/zh-TW/concepts/model-failover)。

## 快速模型原則

- 將主要模型設為你可用的最強新一代模型。
- 對成本／延遲敏感的工作與風險較低的聊天使用備援模型。
- 對啟用工具的代理程式或不受信任的輸入，請避免使用較舊／較弱的模型層級。

## 初始設定

```bash
openclaw onboard
```

為常見供應商設定模型與認證，無須手動編輯設定，包括 OpenAI Codex 訂閱 OAuth 和 Anthropic（API 金鑰或重複使用 Claude 命令列介面）。

若未設定主要模型，全新的 OpenAI API 金鑰設定會選擇
`openai/gpt-5.6`；不含層級的直接 API ID 會解析至 Sol 層級。全新的
ChatGPT/Codex OAuth 設定會選擇完全相符的 `openai/gpt-5.6-sol` 目錄參照。
重新驗證會保留現有且明確指定的主要模型，包括
`openai/gpt-5.5`。若帳戶無法使用 GPT-5.6，請明確選擇
`openai/gpt-5.5`；OpenClaw 不會在未告知的情況下將其降級。

## “不允許使用模型”（以及回覆為何停止）

若已設定 `agents.defaults.models`，它就會成為 `/model` 和工作階段覆寫的允許清單。在產生任何一般回覆前，選取允許清單外的模型會傳回：

```text
不允許使用模型 "provider/model"。請使用 /models 列出供應商，或使用 /models <provider> 列出模型。
使用以下命令新增：openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

修正方式是將模型加入 `agents.defaults.models`、完全清除允許清單（移除該鍵），或從 `/model list` 選擇模型。如果遭拒的命令包含執行階段覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正允許清單，再重試相同的 `/model ... --runtime ...` 命令。

對於本機／GGUF 模型，允許清單需要包含完整且帶有供應商前綴的參照，例如 `ollama/gemma4:26b` 或 `lmstudio/Gemma4-26b-a4-it-gguf` — 請查看 `openclaw models list --provider <provider>` 以取得確切字串。允許清單啟用後，僅有檔案名稱或顯示名稱並不足夠。

若要限制供應商而不逐一列出每個模型，請使用 `provider/*` 萬用字元項目：

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

之後，`/model`、`/models` 和模型選擇器只會顯示這些供應商探索到的目錄，而且無須編輯允許清單即可顯示新模型。你可以混用精確的 `provider/model` 項目與 `provider/*` 項目，以納入另一個供應商的特定模型。

包含別名的允許清單範例：

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

<Accordion title="從命令列介面安全編輯允許清單">
使用 `--merge` 進行增量變更：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

當純物件指派會移除現有項目時，`openclaw config set` 會拒絕將其指派給 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models`；只有在新值應成為完整目標值時才使用 `--replace`。互動式供應商設定與 `openclaw configure --section model` 已會將供應商範圍內的選擇合併到允許清單，因此新增供應商不會移除不相關的項目；設定程序會保留現有的 `agents.defaults.model.primary`。`openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 等明確命令仍會取代主要模型。
</Accordion>

## 聊天中的 `/model`

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` 和 `/model list` 會顯示精簡的編號選擇器（模型系列 + 可用的供應商）；`/model <#>` 會從中選取。在 Discord 上，這會開啟供應商／模型下拉式選單，並包含 Submit 步驟；在 Telegram 上，選擇器的選取結果僅限於工作階段，絕不會改寫 `openclaw.json` 中代理程式的持久預設值。`/models add` 已棄用，會傳回訊息，而不會從聊天中註冊模型。
- `/model` 會立即保存新的工作階段選擇。如果代理程式處於閒置狀態，下一次執行會立即使用它；如果已有執行正在進行，切換會排入佇列，於下一個乾淨的重試點套用（如果工具活動或回覆輸出已開始，則於更後面的重試點套用）。
- `/model default` 會清除工作階段選擇，使其再次繼承已設定的主要模型。
- 使用者透過 `/model` 選取的參照對該工作階段具有嚴格約束：如果該模型變得無法連線，回覆會明確失敗，而不會透過 `agents.defaults.model.fallbacks` 靜默切換。已設定的預設值與排程工作的主要模型仍會使用後備鏈。
- `/model status` 是詳細檢視：顯示每個供應商的驗證候選項目，以及（若已設定）供應商端點 `baseUrl` 與 `api` 模式。
- 模型參照會在第一個 `/` 處分割進行剖析；請輸入 `provider/model`。如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含供應商前綴，例如 `/model openrouter/moonshotai/kimi-k2`。如果省略供應商，OpenClaw 會依序嘗試：(1) 別名符合項目、(2) 該未加前綴之確切模型 ID 的唯一已設定供應商符合項目、(3) 已設定的預設供應商（已棄用的後備機制）——如果該供應商已不再提供已設定的預設模型，則改用第一個已設定的供應商／模型，以避免顯示已移除供應商的過時預設值。
- 模型參照會正規化為小寫；除此之外，供應商 ID 必須完全相符，因此請使用外掛公布的 ID。

完整命令行為與設定：[斜線命令](/zh-TW/tools/slash-commands)。

## 命令列介面

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

沒有子命令的 `openclaw models` 是 `models status` 的捷徑，後者也會顯示驗證儲存區設定檔的 OAuth 到期時間（預設在 24 小時內到期時發出警告）。完整旗標、JSON 結構與驗證設定檔子命令：[模型命令列介面參考](/zh-TW/cli/models)。

<AccordionGroup>
  <Accordion title="掃描（OpenRouter 免費模型）">
    `openclaw models scan` 會檢查 OpenRouter 的公開免費模型目錄，並可即時探測候選模型是否支援工具和圖片。目錄本身是公開的，因此僅掃描中繼資料（`--no-probe`）不需要金鑰；即時探測以及 `--set-default`／`--set-image` 需要 OpenRouter API 金鑰（驗證設定檔或 `OPENROUTER_API_KEY`），若沒有金鑰，則會以封閉式失敗方式僅輸出中繼資料。

    結果依序按以下條件排名：圖片支援、工具延遲、上下文大小、參數數量。在終端介面中，已探測的結果會提示進行互動式後備選擇；非互動模式需要使用 `--yes` 才會接受預設值。

  </Accordion>
</AccordionGroup>

## 模型登錄檔（`models.json`）

在 `models.providers` 下設定的自訂供應商會寫入代理程式目錄中的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。供應商外掛目錄會分別儲存為產生的外掛自有目錄分片，並自動載入。此檔案預設會與設定合併；設定 `models.mode: "replace"` 即可只使用你設定的供應商。

<AccordionGroup>
  <Accordion title="合併模式的優先順序">
    對於相符的供應商 ID：

    - 代理程式 `models.json` 中既有的非空白 `baseUrl` 優先。
    - `models.json` 中的非空白 `apiKey`，僅在目前的設定／驗證設定檔情境中該供應商並非由 SecretRef 管理時優先。
    - 由 SecretRef 管理的 `apiKey` 值會從來源標記重新整理，而不會保存已解析的密鑰：環境變數參照使用環境變數名稱，檔案／執行參照使用 `secretref-managed`。
    - 由 SecretRef 管理的標頭值會以相同方式重新整理，環境變數參照使用 `secretref-env:ENV_VAR_NAME`。
    - `models.json` 中空白或缺少的 `apiKey`／`baseUrl` 會後備使用設定中的 `models.providers`。
    - 其他供應商欄位會從設定和正規化的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

標記保存以來源為準：每當 OpenClaw 重新產生 `models.json` 時（包括由命令驅動的路徑，例如 `openclaw agent`），都會從使用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段密鑰值寫入。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes) — OpenClaw、Codex 與其他代理程式迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [圖片生成](/zh-TW/tools/image-generation) — 圖片模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 後備鏈
- [模型供應商](/zh-TW/concepts/model-providers) — 供應商路由與驗證
- [模型命令列介面參考](/zh-TW/cli/models) — 完整命令與旗標參考
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
