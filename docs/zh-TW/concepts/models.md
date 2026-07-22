---
read_when:
    - 變更模型備援行為或選擇使用者體驗
    - 偵錯「不允許使用模型」或過時的預設供應商備援機制
    - 處理 models.json 合併與祕密資訊行為
sidebarTitle: Models CLI
summary: OpenClaw 如何解析供應商／模型參照、設定鍵，以及 `/model` 聊天命令
title: 模型命令列介面
x-i18n:
    generated_at: "2026-07-22T10:31:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cd13a2aae6575bdfeefb477b7fe8be740b77c66cb76454b07d82481f6612152
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    認證設定檔輪替、冷卻，以及這些機制如何與備援模型互動。
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

模型參照（`provider/model`）選擇的是供應商和模型，而非底層
代理執行階段。若未設定執行階段政策或設為 `auto`，OpenAI 由供應商擁有的
路由政策可能只會針對完全符合官方 HTTPS Platform
Responses 或 ChatGPT Responses、且沒有自行指定要求覆寫的路由選擇 Codex；
僅有 `openai/*` 前綴絕不會選擇 Codex。Completions 轉接器、自訂
端點和自行指定的要求行為仍由 OpenClaw 處理。官方純文字
HTTP 端點會遭拒絕。請參閱 [OpenAI 隱式代理執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

訂閱版 Copilot 參照（`github-copilot/*`）可選擇使用外部
GitHub Copilot 代理執行階段外掛，但此路徑一律必須明確指定（絕不會
由 `auto` 選擇）。執行階段覆寫應設於供應商／模型政策，而非
整個代理或工作階段。執行階段的選擇不決定計費方式：
OpenAI API 金鑰與 ChatGPT/Codex 訂閱認證資訊仍彼此獨立。請參閱
[代理執行階段](/zh-TW/concepts/agent-runtimes)與
[GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## 選擇順序

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或以純字串形式指定 `agents.defaults.model`）。
  </Step>
  <Step title="備援模型">
    `agents.defaults.model.fallbacks`，依序嘗試。
  </Step>
  <Step title="認證容錯移轉">
    在 OpenClaw 移至下一個備援模型之前，會先在供應商內部輪替認證設定檔。
  </Step>
</Steps>

相關的模型設定介面：

- `agents.defaults.models` 儲存別名與各模型設定。新增項目不會限制模型覆寫。
- `agents.defaults.modelPolicy.allow` 是選用的覆寫允許清單。請使用完整參照或結尾前綴萬用字元，例如 `provider/*` 和 `provider/namespace/*`；省略此項或設為 `[]` 即可允許任何模型。各代理的 `agents.entries.*.modelPolicy.allow` 會取代該代理的預設政策。
- `agents.defaults.utilityModel` 是選用的低成本模型，用於簡短的內部工作，例如產生的儀表板工作階段標題、支援的頻道討論串／主題標題，以及進度敘述。各代理的 `agents.entries.*.utilityModel` 可將其覆寫。若未設定，OpenClaw 會在主要供應商宣告小型模型預設值時使用該預設值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`），否則使用代理的主要模型；將其設為空字串可停用工具路由。當獨立的工具模型失敗時，產生標題會使用主要模型重試一次。對於儀表板標題，自動工具模型推導與一般備援會依循有效工作階段供應商和認證設定檔；明確指定的工具模型則會保留其設定的供應商／認證。空的工具模型只會略過替代小型模型路由，不會略過儀表板標題產生。工具工作是個別的模型呼叫，可能會將受限範圍的工作內容傳送給所選模型供應商。
- `agents.defaults.imageModel` 僅在主要模型無法接受圖片時使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。若未設定，該工具會依序回退至 `imageModel`，再回退至解析後的工作階段／預設模型。
- `agents.defaults.mediaModels.{image,music,video}` 支援共用媒體產生工具。若未設定，每項工具都會推斷具認證支援的供應商預設值：先使用目前預設供應商，再依供應商 ID 順序使用其餘已註冊且支援該能力的供應商。跨供應商備援是固定的預設行為。
- 各代理的 `agents.entries.*.model`（加上繫結）會覆寫 `agents.defaults.model` — 請參閱[多代理路由](/zh-TW/concepts/multi-agent)。

完整的設定鍵參考、預設值和 JSON5 範例：[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 選擇來源與備援嚴格度

相同的 `provider/model` 會依其來源而有不同的行為：

| 來源                                                                  | 行為                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已設定的預設值（`agents.defaults.model.primary`、各代理主要模型） | 一般起始點；使用 `agents.defaults.model.fallbacks`。                                                                                                                                                                                                 |
| 自動備援                                                           | 暫時性復原狀態，儲存為 `modelOverrideSource: "auto"`。OpenClaw 會定期重新探測原始主要模型，在恢復時清除自動選擇，並於每次狀態變更時宣告一次備援／恢復轉換。                              |
| 使用者工作階段選擇                                                  | 精確且嚴格。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`。若該供應商／模型無法連線，執行會明確失敗，而不會繼續改用另一個已設定模型。 |
| 排程 `--model`／承載資料 `model`                                        | 各工作的主要模型。除非工作提供自己的承載資料 `fallbacks`（`fallbacks: []` 會強制嚴格執行），否則仍會使用已設定的備援模型。                                                                                                                    |

其他選擇規則：

- 變更 `agents.defaults.model.primary` 不會重寫現有工作階段釘選。若狀態回報 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，請執行 `/model default` 以清除釘選。
- 命令列介面的預設模型與允許清單選擇器會遵循 `models.mode: "replace"`，只列出 `models.providers.*.models`，而非完整內建目錄。
- Control UI 模型選擇器會向閘道要求其已設定的模型檢視。明確指定的 `modelPolicy.allow` 會篩選該檢視，包括結尾前綴萬用字元項目；否則會顯示已設定的模型，以及具有可用認證資訊的供應商。完整內建目錄僅供明確的瀏覽檢視使用（搭配 `view: "all"` 的 `models.list`，或 `openclaw models list --all`）。
- 供應商清單 UI 使用搭配 `view: "provider-config"` 的 `models.list`，顯示來源自行定義的 `models.providers.*.models` 資料列，而不套用選擇器允許清單。

完整機制：[模型容錯移轉](/zh-TW/concepts/model-failover)。

## 快速模型政策

- 將主要模型設為你可用的最強最新世代模型。
- 對成本／延遲敏感的工作與風險較低的聊天使用備援模型。
- 對啟用工具的代理或不受信任的輸入，請避免使用較舊／較弱的模型層級。

## 初始設定

```bash
openclaw onboard
```

為常見供應商設定模型與認證，無須手動編輯設定，包括 OpenAI Codex 訂閱 OAuth 和 Anthropic（API 金鑰或重用 Claude CLI）。

若尚未設定主要模型，全新的 OpenAI API 金鑰設定會選擇
`openai/gpt-5.6`；不含修飾的直接 API ID 會解析為 Sol 層級。全新的
ChatGPT/Codex OAuth 設定會選擇完整的 `openai/gpt-5.6-sol` 目錄參照。
重新認證時會保留現有的明確主要模型，包括
`openai/gpt-5.5`。若帳戶無法使用 GPT-5.6，請明確選擇
`openai/gpt-5.5`；OpenClaw 不會在未告知的情況下將其降級。

## “不允許使用模型”（以及回覆停止的原因）

若 `agents.defaults.modelPolicy.allow` 非空，便會成為 `/model`、工作階段覆寫和 `--model` 的允許清單。選擇允許清單以外的模型時，會在產生任何一般回覆前直接返回。各代理的 `agents.entries.*.modelPolicy.allow` 會取代該代理的預設政策。

```text
agents.defaults.modelPolicy.allow 不允許模型覆寫 "provider/model"。
請將 "provider/model"、"provider/*" 或更精確的 "provider/namespace/*" 前綴新增至 agents.defaults.modelPolicy.allow，或移除／清空該清單以允許任何模型。
```

修正方式是將模型或供應商萬用字元新增至指定的 `modelPolicy.allow` 鍵、移除／清空該清單，或從 `/model list` 選擇模型。若遭拒絕的命令包含 `/model openai/gpt-5.5 --runtime codex` 等執行階段覆寫，請先修正允許清單，再重新嘗試相同命令。

對於本機／GGUF 模型，允許清單必須包含完整的供應商前綴參照，例如 `ollama/gemma4:26b` 或 `lmstudio/Gemma4-26b-a4-it-gguf` — 請查看 `openclaw models list --provider <provider>` 以取得確切字串。啟用允許清單後，僅使用檔案名稱或顯示名稱並不足夠。

若要限制供應商而不逐一列出每個模型，請使用結尾前綴萬用字元項目。供應商範圍的 `provider/*` 會比對該供應商下的每個模型；較精確的前綴（例如 `clawrouter/anthropic/*`）只會比對該命名空間：

```json5
{
  agents: {
    defaults: {
      modelPolicy: {
        allow: ["openai/*", "vllm/*"],
      },
    },
  },
}
```

之後，`/model`、`/models` 和模型選擇器只會顯示為這些供應商探索到的目錄，新模型也能在不編輯允許清單的情況下出現。將完整的 `provider/model` 項目與 `provider/*` 項目混用，即可納入另一個供應商的某個特定模型。

包含別名與各模型設定的允許清單範例：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      modelPolicy: {
        allow: ["anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="明確編輯允許清單">
直接設定完整清單：

```bash
openclaw config set agents.defaults.modelPolicy.allow '["openai/gpt-5.4","anthropic/*"]' --strict-json
```

`openclaw models set`、供應商設定和 `openclaw models aliases add` 可以在 `agents.defaults.models` 下新增項目，但絕不會變更 `modelPolicy.allow`。這能讓模型中繼資料和別名與覆寫政策彼此獨立。
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

- `/model` 和 `/model list` 會顯示精簡的編號選擇器（模型系列 + 可用的供應商）；`/model <#>` 會從中選取。在 Discord 上，這會開啟供應商／模型下拉式選單，並包含提交步驟；在 Telegram 上，選擇器的選項僅限工作階段使用，絕不會改寫代理程式在 `openclaw.json` 中的持久預設值。`/models add` 已淘汰，會傳回訊息，而不會從聊天中註冊模型。
- `/model` 會立即保存新的工作階段選項。如果代理程式閒置中，下一次執行會立即使用它；如果已有執行作業進行中，切換會排入佇列，並在下一個可安全重試的時間點套用（如果工具活動或回覆輸出已開始，則會在之後的時間點套用）。
- `/model default` 會清除工作階段選項，使其重新繼承已設定的主要模型。
- 使用者選取的 `/model` 參照會在該工作階段中嚴格生效：如果它變得無法連線，回覆會明確失敗，而不會透過 `agents.defaults.model.fallbacks` 靜默遞補。已設定的預設值和排程工作主要模型仍會使用遞補鏈。
- `/model status` 是詳細檢視：顯示每個供應商的驗證候選項目，以及（若已設定）供應商端點 `baseUrl` 和 `api` 模式。
- 模型參照會在第一個 `/` 處分割以進行剖析；請輸入 `provider/model`。如果模型 ID 本身包含 `/`（OpenRouter 樣式），請加入供應商前綴，例如 `/model openrouter/moonshotai/kimi-k2`。如果省略供應商，OpenClaw 會依序嘗試：(1) 別名比對、(2) 在已設定的供應商中，比對該未加前綴模型 ID 的唯一結果、(3) 已設定的預設供應商（已淘汰的遞補行為）——如果該供應商不再提供已設定的預設模型，則改用第一個已設定的供應商／模型，以避免顯示已移除供應商所留下的過時預設值。
- 模型參照會正規化為小寫；除此之外，供應商 ID 必須完全相符，因此請使用外掛公告的 ID。

完整的命令行為與設定：[斜線命令](/zh-TW/tools/slash-commands)。

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

沒有子命令的 `openclaw models` 是 `models status` 的快捷方式，後者也會顯示認證儲存區設定檔的 OAuth 到期時間（預設會在 24h 內到期時發出警告）。完整旗標、JSON 結構和認證設定檔子命令：[模型命令列介面參考](/zh-TW/cli/models)。

<AccordionGroup>
  <Accordion title="掃描（OpenRouter 免費模型）">
    `openclaw models scan` 會檢查 OpenRouter 的公開免費模型目錄，並可即時探測候選模型是否支援工具與圖片。目錄本身是公開的，因此僅中繼資料掃描（`--no-probe`）不需要金鑰；即時探測以及 `--set-default`/`--set-image` 需要 OpenRouter API 金鑰（認證設定檔或 `OPENROUTER_API_KEY`），若沒有金鑰，則會採取封閉式失敗，只輸出中繼資料。

    結果排序依序為：圖片支援、工具延遲、上下文大小、參數數量。在 TTY 中，探測結果會提示以互動方式選取遞補模型；非互動模式需要 `--yes` 才會接受預設值。

  </Accordion>
</AccordionGroup>

## 模型登錄檔（`models.json`）

在 `models.providers` 下設定的自訂供應商，會寫入代理程式目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。供應商外掛目錄會另外儲存為產生的、由外掛擁有的目錄分片，並自動載入。此檔案預設會與設定合併；設定 `models.mode: "replace"` 可僅使用你設定的供應商。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    對於相符的供應商 ID：

    - 代理程式 `models.json` 中既有的非空 `baseUrl` 優先。
    - `models.json` 中的非空 `apiKey`，僅在目前的設定／認證設定檔情境中該供應商不是由 SecretRef 管理時優先。
    - 由 SecretRef 管理的 `apiKey` 值會從來源標記重新整理，而不會保存已解析的機密：環境變數參照使用環境變數名稱，檔案／執行參照使用 `secretref-managed`。
    - 由 SecretRef 管理的標頭值會以相同方式重新整理，環境變數參照使用 `secretref-env:ENV_VAR_NAME`。
    - `models.json` 中空白或缺少的 `apiKey`/`baseUrl`，會遞補至設定中的 `models.providers`。
    - 其他供應商欄位會從設定和正規化後的目錄資料重新整理。

  </Accordion>
</AccordionGroup>

標記的持久保存以來源為準：每當 OpenClaw 重新產生 `models.json` 時（包括 `openclaw agent` 等命令驅動的路徑），都會從有效的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段機密值寫入。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes) — OpenClaw、Codex 和其他代理程式迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [圖片生成](/zh-TW/tools/image-generation) — 圖片模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 遞補鏈
- [模型供應商](/zh-TW/concepts/model-providers) — 供應商路由與驗證
- [模型命令列介面參考](/zh-TW/cli/models) — 完整命令與旗標參考
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
