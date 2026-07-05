---
read_when:
    - 變更模型備援行為或選擇體驗
    - 偵錯「model is not allowed」或過時的預設供應商 fallback
    - 正在處理 models.json 合併/密鑰行為
sidebarTitle: Models CLI
summary: OpenClaw 如何解析供應商/模型參照、設定鍵，以及 `/model` 聊天命令
title: 模型命令列介面
x-i18n:
    generated_at: "2026-07-05T11:14:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ec0558d7b4b97954b0be20e1d17bbc4e1e80695b8ca16db29fcabcbc07a3850
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="模型容錯移轉" href="/zh-TW/concepts/model-failover">
    驗證設定檔輪替、冷卻時間，以及它如何與備援機制互動。
  </Card>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers">
    快速的供應商概覽與範例。
  </Card>
  <Card title="模型命令列介面參考" href="/zh-TW/cli/models">
    完整的 `openclaw models` 命令與旗標參考。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults">
    模型設定鍵、預設值與範例。
  </Card>
</CardGroup>

模型參照 (`provider/model`) 會選擇供應商與模型。它通常不會選擇底層代理執行階段。OpenAI 是主要例外：`openai/gpt-5.5` 在官方 OpenAI 供應商上，預設會透過 Codex app-server 執行階段執行。訂閱 Copilot 參照 (`github-copilot/*`) 可以選擇使用外部 GitHub Copilot 代理執行階段外掛，但該路徑永遠是明確指定的（絕不會由 `auto` 選取）。執行階段覆寫屬於供應商/模型政策，不屬於整個代理或工作階段。在 Codex 執行階段模式中，`openai/gpt-*` 不代表 API 金鑰計費；驗證可以來自 Codex 帳號或 `openai` OAuth 設定檔。請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)與 [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## 選取順序

<Steps>
  <Step title="主要模型">
    `agents.defaults.model.primary`（或以純字串形式使用 `agents.defaults.model`）。
  </Step>
  <Step title="備援模型">
    `agents.defaults.model.fallbacks`，依序嘗試。
  </Step>
  <Step title="驗證容錯移轉">
    在 OpenClaw 移至下一個備援模型之前，驗證設定檔輪替會在供應商內部發生。
  </Step>
</Steps>

相關的模型設定介面：

- `agents.defaults.models` 是 OpenClaw 可使用模型的允許清單/目錄，另含別名。使用 `provider/*` 項目，可允許來自某個供應商的所有已探索模型，而不必逐一列出。
- `agents.defaults.utilityModel` 是可選的較低成本模型，用於短小的內部任務，例如產生的儀表板工作階段標題，以及支援的頻道執行緒/主題標題。每個代理的 `agents.list[].utilityModel` 會覆寫它。未設定時，這些任務會使用代理的主要模型。工具任務是獨立的模型呼叫，可能會將有界限的任務內容傳送給選取的模型供應商。
- `agents.defaults.imageModel` 僅在主要模型無法接受圖片時使用。
- `agents.defaults.pdfModel` 由 `pdf` 工具使用。若未設定，工具會退回到 `imageModel`，再退回到解析後的工作階段/預設模型。
- `agents.defaults.imageGenerationModel`、`musicGenerationModel` 和 `videoGenerationModel` 支援共用的媒體產生工具。若未設定，每個工具都會推斷有驗證支援的供應商預設值：先使用目前的預設供應商，接著依供應商 ID 順序使用該能力的其餘已註冊供應商。設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可停用該跨供應商推斷，同時保留明確的備援。
- 每個代理的 `agents.list[].model`（加上繫結）會覆寫 `agents.defaults.model` — 請參閱[多代理路由](/zh-TW/concepts/multi-agent)。

完整鍵參考、預設值與 JSON5 範例：[設定參考](/zh-TW/gateway/config-agents#agent-defaults)。

## 選取來源與備援嚴格性

同一個 `provider/model` 會依其來源而有不同表現：

| 來源                                                                  | 行為                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已設定的預設值 (`agents.defaults.model.primary`、每個代理的主要模型) | 一般起點；使用 `agents.defaults.model.fallbacks`。                                                                                                                                                                                                 |
| 自動備援                                                           | 暫時復原狀態，儲存為 `modelOverrideSource: "auto"`。OpenClaw 會定期重新探測原始主要模型，在復原時清除自動選取，並且每次狀態變更只公告一次備援/復原轉換。                              |
| 使用者工作階段選取                                                  | 精確且嚴格。`/model`、模型選擇器、`session_status(model=...)` 和 `sessions.patch` 會儲存 `modelOverrideSource: "user"`。如果該供應商/模型無法連線，執行會明顯失敗，而不是轉落到另一個已設定模型。 |
| Cron `--model` / 酬載 `model`                                        | 每個工作作業的主要模型。除非工作作業提供自己的酬載 `fallbacks`（`fallbacks: []` 會強制嚴格執行），否則仍會使用已設定的備援。                                                                                                                    |

其他選取規則：

- 變更 `agents.defaults.model.primary` 不會重寫既有的工作階段釘選。若狀態回報 `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`，請執行 `/model default` 以清除釘選。
- 命令列介面預設模型與允許清單選擇器會遵守 `models.mode: "replace"`，只列出 `models.providers.*.models`，而不是完整的內建目錄。
- Control UI 模型選擇器會向閘道要求其設定的模型檢視：若已設定，則使用 `agents.defaults.models`（包括 `provider/*` 萬用字元項目），否則使用 `models.providers.*.models` 加上具有可用驗證的供應商。完整內建目錄保留給明確瀏覽檢視（含 `view: "all"` 的 `models.list`，或 `openclaw models list --all`）。

完整機制：[模型容錯移轉](/zh-TW/concepts/model-failover)。

## 快速模型政策

- 將你的主要模型設定為你可用的最強最新一代模型。
- 對成本/延遲敏感的任務與較低風險的聊天使用備援模型。
- 對啟用工具的代理或不受信任的輸入，避免使用較舊/較弱的模型層級。

## 初始設定

```bash
openclaw onboard
```

為常見供應商設定模型與驗證，不需要手動編輯設定，包括 OpenAI Codex 訂閱 OAuth 和 Anthropic（API 金鑰或 Claude 命令列介面重用）。

## 「不允許使用模型」（以及為何回覆會停止）

如果設定了 `agents.defaults.models`，它會成為 `/model` 與工作階段覆寫的允許清單。選取允許清單外的模型時，會在產生任何正常回覆之前傳回：

```text
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

請透過將模型加入 `agents.defaults.models`、完全清除允許清單（移除該鍵），或從 `/model list` 選擇模型來修正。如果遭拒的命令包含執行階段覆寫，例如 `/model openai/gpt-5.5 --runtime codex`，請先修正允許清單，再重試同一個 `/model ... --runtime ...` 命令。

對於本機/GGUF 模型，允許清單需要完整的供應商前綴參照，例如 `ollama/gemma4:26b` 或 `lmstudio/Gemma4-26b-a4-it-gguf` — 請查看 `openclaw models list --provider <provider>` 取得精確字串。一旦允許清單啟用，單純檔名或顯示名稱就不夠。

若要限制供應商而不逐一列出所有模型，請使用 `provider/*` 萬用字元項目：

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

接著 `/model`、`/models` 和模型選擇器只會顯示這些供應商的已探索目錄，而且新模型可以在不編輯允許清單的情況下出現。將精確的 `provider/model` 項目與 `provider/*` 項目混合使用，可納入另一個供應商的一個特定模型。

含別名的允許清單範例：

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
使用 `--merge` 進行新增式變更：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

當 `openclaw config set` 對 `agents.defaults.models`、`models.providers` 或 `models.providers.<id>.models` 的純物件指派會捨棄既有項目時，會拒絕該指派；只有在新值應成為完整目標值時，才使用 `--replace`。互動式供應商設定與 `openclaw configure --section model` 已經會將供應商範圍的選取合併到允許清單，因此新增供應商不會捨棄不相關的項目；configure 會保留既有的 `agents.defaults.model.primary`。明確命令如 `openclaw models auth login --provider <id> --set-default` 和 `openclaw models set <model>` 仍會取代主要模型。
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

- `/model` 和 `/model list` 會顯示精簡的編號選擇器（模型系列 + 可用供應商）；`/model <#>` 會從中選取。在 Discord 上，這會開啟含提交步驟的供應商/模型下拉選單；在 Telegram 上，選擇器選項的範圍限於工作階段，且絕不會重寫 `openclaw.json` 中代理的持久預設值。`/models add` 已淘汰，會回傳訊息，而不是從聊天註冊模型。
- `/model` 會立即保存新的工作階段選取。如果代理閒置，下一次執行會立刻使用它；如果執行已經進行中，切換會排入佇列，等到下一個乾淨的重試點（若工具活動或回覆輸出已開始，則可能是更晚的重試點）。
- `/model default` 會清除工作階段選取，使其再次繼承已設定的主要模型。
- 使用者選取的 `/model` 參照對該工作階段是嚴格的：如果它無法連線，回覆會明顯失敗，而不是悄悄透過 `agents.defaults.model.fallbacks` 轉落。已設定的預設值與 Cron 工作主要模型仍會使用備援鏈。
- `/model status` 是詳細檢視：每個供應商的驗證候選項，以及（設定時）供應商端點 `baseUrl` 加上 `api` 模式。
- 模型參照會透過第一個 `/` 分割來剖析；請輸入 `provider/model`。如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含供應商前綴，例如 `/model openrouter/moonshotai/kimi-k2`。如果省略供應商，OpenClaw 會嘗試：(1) 別名符合、(2) 該精確無前綴模型 ID 的唯一已設定供應商符合、(3) 已設定的預設供應商（已淘汰備援）— 若該供應商不再公開已設定的預設模型，則改用第一個已設定的供應商/模型，以避免顯示過時的已移除供應商預設值。
- 模型參照會正規化為小寫；除此之外，供應商 ID 必須精確，因此請使用外掛公告的 ID。

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

`openclaw models` 不加子命令時，是 `models status` 的捷徑，也會顯示 auth-store 設定檔的 OAuth 到期狀態（預設會在 24 小時內到期時警告）。完整旗標、JSON 結構與 auth-profile 子命令：[模型命令列介面參考](/zh-TW/cli/models)。

<AccordionGroup>
  <Accordion title="掃描（OpenRouter 免費模型）">
    `openclaw models scan` 會檢查 OpenRouter 的公開免費模型目錄，並可即時探測候選模型是否支援工具與圖片。目錄本身是公開的，因此僅中繼資料掃描（`--no-probe`）不需要金鑰；即時探測與 `--set-default`/`--set-image` 需要 OpenRouter API 金鑰（auth profile 或 `OPENROUTER_API_KEY`），若沒有金鑰，會封閉失敗並僅輸出中繼資料。

    結果排序依序為：圖片支援、工具延遲、脈絡大小、參數數量。在 TTY 中，已探測的結果會提示互動式備援選擇；非互動模式需要 `--yes` 才會接受預設值。

  </Accordion>
</AccordionGroup>

## 模型登錄檔（`models.json`）

在 `models.providers` 下設定的自訂提供者會寫入代理目錄下的 `models.json`（預設為 `~/.openclaw/agents/<agentId>/agent/models.json`）。提供者外掛目錄會另外儲存為產生的外掛擁有目錄分片，並自動載入。此檔案預設會與設定合併；設定 `models.mode: "replace"` 則只使用你設定的提供者。

<AccordionGroup>
  <Accordion title="合併模式優先順序">
    對於相符的提供者 ID：

    - 代理 `models.json` 中既有的非空 `baseUrl` 優先。
    - `models.json` 中的非空 `apiKey` 只有在該提供者不受目前設定/auth-profile 情境中的 SecretRef 管理時才優先。
    - SecretRef 管理的 `apiKey` 值會從來源標記重新整理，而不是保留已解析的秘密值：env refs 使用環境變數名稱，file/exec refs 使用 `secretref-managed`。
    - SecretRef 管理的標頭值會以相同方式重新整理，env refs 使用 `secretref-env:ENV_VAR_NAME`。
    - `models.json` 中空白或缺少的 `apiKey`/`baseUrl` 會回退到設定中的 `models.providers`。
    - 其他提供者欄位會從設定與標準化目錄資料重新整理。

  </Accordion>
</AccordionGroup>

標記持久化以來源為權威：OpenClaw 在重新產生 `models.json` 時，會從作用中的來源設定快照（解析前）寫入標記，而不是從已解析的執行階段秘密值寫入，包括像 `openclaw agent` 這類由命令驅動的路徑。

## 相關

- [代理執行階段](/zh-TW/concepts/agent-runtimes) — OpenClaw、Codex 與其他代理迴圈執行階段
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — 模型設定鍵
- [圖片生成](/zh-TW/tools/image-generation) — 圖片模型設定
- [模型容錯移轉](/zh-TW/concepts/model-failover) — 備援鏈
- [模型提供者](/zh-TW/concepts/model-providers) — 提供者路由與驗證
- [模型命令列介面參考](/zh-TW/cli/models) — 完整命令與旗標參考
- [音樂生成](/zh-TW/tools/music-generation) — 音樂模型設定
- [影片生成](/zh-TW/tools/video-generation) — 影片模型設定
