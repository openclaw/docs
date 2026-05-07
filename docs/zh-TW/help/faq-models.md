---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉 /「所有模型皆失敗」
    - 了解身分驗證設定檔及其管理方式
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、容錯移轉與驗證設定檔
title: 常見問題：模型與身分驗證
x-i18n:
    generated_at: "2026-05-07T13:19:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  模型與驗證設定檔問答。如需設定、工作階段、Gateway、頻道與
  疑難排解，請參閱主要的 [FAQ](/zh-TW/help/faq)。

  ## 模型：預設值、選擇、別名、切換

  <AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    OpenClaw 的預設模型是你設定在以下位置的任何模型：

    ```
    agents.defaults.model.primary
    ```

    模型會以 `provider/model` 參照（範例：`openai/gpt-5.5` 或 `anthropic/claude-sonnet-4-6`）。如果你省略提供者，OpenClaw 會先嘗試別名，接著為該精確模型 ID 尋找唯一的已設定提供者相符項，最後才會退回到已設定的預設提供者，作為已棄用的相容性路徑。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的提供者/模型，而不是顯示過時的已移除提供者預設值。你仍應該**明確**設定 `provider/model`。

  </Accordion>

  <Accordion title="你推薦哪個模型？">
    **建議的預設值：**使用你的提供者堆疊中可用的最強最新世代模型。
    **對於啟用工具或處理不受信任輸入的代理：**優先考量模型能力，而不是成本。
    **對於例行/低風險聊天：**使用較便宜的備援模型，並依代理角色路由。

    MiniMax 有自己的文件：[MiniMax](/zh-TW/providers/minimax) 和
    [本機模型](/zh-TW/gateway/local-models)。

    經驗法則：對於高風險工作，使用**你負擔得起的最佳模型**；對於例行聊天或摘要，則使用較便宜的
    模型。你可以按代理路由模型，並使用子代理來
    平行處理長任務（每個子代理都會消耗權杖）。請參閱[模型](/zh-TW/concepts/models)和
    [子代理](/zh-TW/tools/subagents)。

    強烈警告：較弱/過度量化的模型更容易受到提示
    注入與不安全行為影響。請參閱[安全性](/zh-TW/gateway/security)。

    更多背景：[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    使用**模型命令**，或只編輯**模型**欄位。避免完整取代設定。

    安全選項：

    - 聊天中的 `/model`（快速、每個工作階段）
    - `openclaw models set ...`（只更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    避免用部分物件呼叫 `config.apply`，除非你打算取代整個設定。
    對於 RPC 編輯，請先用 `config.schema.lookup` 檢查，並優先使用 `config.patch`。查詢承載會提供正規化路徑、淺層結構描述文件/限制，以及直接子項摘要。
    用於部分更新。
    如果你已覆寫設定，請從備份還原，或重新執行 `openclaw doctor` 進行修復。

    文件：[模型](/zh-TW/concepts/models)、[設定](/zh-TW/cli/configure)、[Config](/zh-TW/cli/config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自架模型（llama.cpp、vLLM、Ollama）嗎？">
    可以。Ollama 是使用本機模型最簡單的路徑。

    最快速設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 如果你也想使用雲端模型，執行 `ollama signin`
    4. 執行 `openclaw onboard` 並選擇 `Ollama`
    5. 選擇 `Local` 或 `Cloud + Local`

    注意事項：

    - `Cloud + Local` 會提供雲端模型加上你的本機 Ollama 模型
    - `kimi-k2.5:cloud` 等雲端模型不需要本機拉取
    - 若要手動切換，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全性注意：較小或高度量化的模型更容易受到提示
    注入影響。對於任何可使用工具的機器人，我們強烈建議使用**大型模型**。
    如果你仍想使用小型模型，請啟用沙箱化與嚴格的工具允許清單。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型提供者](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱化](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用哪些模型？">
    - 這些部署可能不同，也可能隨時間變更；沒有固定的提供者建議。
    - 使用 `openclaw models status` 檢查每個 gateway 上目前的執行階段設定。
    - 對於安全敏感/啟用工具的代理，請使用可用的最強最新世代模型。

  </Accordion>

  <Accordion title="如何即時切換模型（不重新啟動）？">
    將 `/model` 命令作為獨立訊息使用：

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    這些是內建別名。自訂別名可以透過 `agents.defaults.models` 新增。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（和 `/model list`）會顯示精簡的編號選擇器。依編號選擇：

    ```
    /model 3
    ```

    你也可以為提供者強制指定特定驗證設定檔（每個工作階段）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 會顯示哪個代理處於作用中、正在使用哪個 `auth-profiles.json` 檔案，以及下一個將嘗試哪個驗證設定檔。
    它也會在可用時顯示已設定的提供者端點（`baseUrl`）與 API 模式（`api`）。

    **如何取消釘選我用 @profile 設定的設定檔？**

    重新執行不含 `@profile` 後綴的 `/model`：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到預設值，從 `/model` 選取它（或傳送 `/model <default provider/model>`）。
    使用 `/model status` 確認哪個驗證設定檔處於作用中。

  </Accordion>

  <Accordion title="我可以用 GPT 5.5 處理日常任務，並用 Codex 5.5 寫程式嗎？">
    可以。請將模型選擇與執行階段選擇分開看待：

    - **原生 Codex 程式設計代理：**將 `agents.defaults.model.primary` 設為 `openai/gpt-5.5`。當你想使用 ChatGPT/Codex 訂閱驗證時，使用 `openclaw models auth login --provider openai-codex` 登入。
    - **代理迴圈之外的直接 OpenAI API 任務：**為影像、嵌入、語音、即時與其他非代理 OpenAI API 介面設定 `OPENAI_API_KEY`。
    - **OpenAI 代理 API 金鑰驗證：**搭配有序的 `openai-codex` API 金鑰設定檔使用 `/model openai/gpt-5.5`。
    - **子代理：**將程式設計任務路由到僅 Codex 的代理，並搭配其自己的模型與 `agentRuntime` 預設值。

    請參閱[模型](/zh-TW/concepts/models)和[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何為 GPT 5.5 設定快速模式？">
    使用工作階段切換或設定預設值：

    - **每個工作階段：**當工作階段使用 `openai/gpt-5.5` 時，傳送 `/fast on`。
    - **每個模型預設值：**將 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 設為 `true`。

    範例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    對於 OpenAI，快速模式會在支援的原生 Responses 請求上映射到 `service_tier = "priority"`。工作階段 `/fast` 覆寫會優先於設定預設值。

    請參閱[思考與快速模式](/zh-TW/tools/thinking)和 [OpenAI 快速模式](/zh-TW/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='為什麼我看到「Model ... is not allowed」然後沒有回覆？'>
    如果設定了 `agents.defaults.models`，它會成為 `/model` 與任何
    工作階段覆寫的**允許清單**。選擇不在該清單中的模型會傳回：

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    該錯誤會**取代**一般回覆傳回。修正方式：將模型加入
    `agents.defaults.models`、移除允許清單，或從 `/model list` 選擇模型。
    如果命令也包含 `--runtime codex`，請先新增模型，然後重試
    相同的 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='為什麼我看到「Unknown model: minimax/MiniMax-M2.7」？'>
    這表示**提供者尚未設定**（找不到 MiniMax 提供者設定或驗證
    設定檔），因此無法解析模型。

    修正檢查清單：

    1. 升級到目前的 OpenClaw 版本（或從原始碼 `main` 執行），然後重新啟動 gateway。
    2. 確認已設定 MiniMax（精靈或 JSON），或 MiniMax 驗證
       存在於 env/驗證設定檔中，以便注入相符的提供者
       （`MINIMAX_API_KEY` 用於 `minimax`，`MINIMAX_OAUTH_TOKEN` 或已儲存的 MiniMax
       OAuth 用於 `minimax-portal`）。
    3. 依你的驗證路徑使用精確的模型 ID（區分大小寫）：
       `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed` 用於 API 金鑰
       設定，或 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` 用於 OAuth 設定。
    4. 執行：

       ```bash
       openclaw models list
       ```

       並從清單選擇（或在聊天中使用 `/model list`）。

    請參閱 [MiniMax](/zh-TW/providers/minimax) 和[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以將 MiniMax 設為預設，並在複雜任務使用 OpenAI 嗎？">
    可以。使用 **MiniMax 作為預設值**，並在需要時**按工作階段**切換模型。
    備援用於**錯誤**，不是用於「困難任務」，因此請使用 `/model` 或另一個代理。

    **選項 A：按工作階段切換**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    然後：

    ```
    /model gpt
    ```

    **選項 B：分開的代理**

    - 代理 A 預設值：MiniMax
    - 代理 B 預設值：OpenAI
    - 依代理路由，或使用 `/agent` 切換

    文件：[模型](/zh-TW/concepts/models)、[多代理路由](/zh-TW/concepts/multi-agent)、[MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是內建捷徑嗎？">
    是。OpenClaw 隨附幾個預設簡寫（只有當模型存在於 `agents.defaults.models` 時才會套用）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    如果你用相同名稱設定自己的別名，會以你的值為準。

  </Accordion>

  <Accordion title="如何定義/覆寫模型捷徑（別名）？">
    別名來自 `agents.defaults.models.<modelId>.alias`。範例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    然後 `/model sonnet`（或在支援時使用 `/<alias>`）會解析為該模型 ID。

  </Accordion>

  <Accordion title="如何加入 OpenRouter 或 Z.AI 等其他提供者的模型？">
    OpenRouter（依權杖付費；許多模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM 模型）：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    如果你參照某個提供者/模型，但缺少必要的提供者金鑰，你會收到執行階段驗證錯誤（例如 `No API key found for provider "zai"`）。

    **加入新代理程式後找不到提供者的 API 金鑰**

    這通常表示**新代理程式**的驗證儲存區是空的。驗證是各代理程式分開管理，並儲存在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正選項：

    - 執行 `openclaw agents add <id>`，並在精靈中設定驗證。
    - 或只從主要代理程式的驗證儲存區，將可攜式靜態 `api_key` / `token` 設定檔複製到新代理程式的驗證儲存區。
    - 對於 OAuth 設定檔，若新代理程式需要自己的帳戶，請從該新代理程式登入；否則 OpenClaw 可以透過預設/主要代理程式讀取，而不需要複製重新整理權杖。

    **不要**在多個代理程式之間重複使用 `agentDir`；這會造成驗證/工作階段衝突。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型都失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    容錯移轉分兩個階段進行：

    1. 在同一個提供者內進行**驗證設定檔輪替**。
    2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

    冷卻會套用到失敗的設定檔（指數退避），因此即使提供者受到速率限制或暫時失敗，OpenClaw 仍能持續回應。

    速率限制儲存桶不只包含一般的 `429` 回應。OpenClaw
    也會將 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及週期性
    使用量視窗限制（`weekly/monthly limit reached`）等訊息，視為值得進行容錯移轉的
    速率限制。

    有些看似計費相關的回應不是 `402`，而有些 HTTP `402`
    回應也會保留在該暫時性儲存桶中。如果提供者在 `401` 或 `403` 回傳
    明確的計費文字，OpenClaw 仍可將其保留在
    計費通道中，但提供者特定的文字比對器會維持在擁有它們的
    提供者範圍內（例如 OpenRouter `Key limit exceeded`）。如果 `402`
    訊息看起來比較像可重試的使用量視窗或
    組織/工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 會將其視為
    `rate_limit`，而不是長時間的計費停用。

    內容溢位錯誤不同：像是
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`，或 `ollama error: context length
    exceeded` 這類特徵，會停留在 Compaction/重試路徑，而不是推進模型
    備援。

    一般伺服器錯誤文字的判定刻意比「任何含有
    unknown/error 的內容」更窄。OpenClaw 的確會將提供者範圍內的暫時性形狀，
    例如 Anthropic 單純的 `An unknown error occurred`、OpenRouter 單純的
    `Provider returned error`、像 `Unhandled stop reason:
    error` 這類停止原因錯誤、帶有暫時性伺服器文字的 JSON `api_error` 酬載
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及像 `ModelNotReadyException` 這類提供者忙碌錯誤，
    在提供者情境相符時，視為值得進行容錯移轉的逾時/過載訊號。
    像 `LLM request failed with an unknown
    error.` 這種一般內部備援文字會維持保守，單靠它本身不會觸發模型備援。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」是什麼意思？'>
    這表示系統嘗試使用驗證設定檔 ID `anthropic:default`，但在預期的驗證儲存區中找不到它的認證。

    **修正檢查清單：**

    - **確認驗證設定檔所在位置**（新路徑與舊路徑）
      - 目前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 舊版：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）
    - **確認你的環境變數已由 Gateway 載入**
      - 如果你在 shell 中設定 `ANTHROPIC_API_KEY`，但透過 systemd/launchd 執行 Gateway，它可能不會繼承該變數。請將它放入 `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - **確認你正在編輯正確的代理程式**
      - 多代理程式設定表示可能有多個 `auth-profiles.json` 檔案。
    - **基本檢查模型/驗證狀態**
      - 使用 `openclaw models status` 查看已設定的模型，以及提供者是否已通過驗證。

    **「No credentials found for profile anthropic」的修正檢查清單**

    這表示該次執行被固定到 Anthropic 驗證設定檔，但 Gateway
    在其驗證儲存區中找不到它。

    - **使用 Claude CLI**
      - 在 gateway 主機上執行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 金鑰**
      - 在 **gateway 主機**上的 `~/.openclaw/.env` 放入 `ANTHROPIC_API_KEY`。
      - 清除任何強制使用缺失設定檔的固定順序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **確認你正在 gateway 主機上執行指令**
      - 在遠端模式中，驗證設定檔位於 gateway 機器上，而不是你的筆電。

  </Accordion>

  <Accordion title="為什麼它也嘗試 Google Gemini 並失敗？">
    如果你的模型設定包含 Google Gemini 作為備援（或你切換到了 Gemini 簡寫），OpenClaw 會在模型備援期間嘗試它。如果你尚未設定 Google 認證，你會看到 `No API key found for provider "google"`。

    修正方式：提供 Google 驗證，或從 `agents.defaults.model.fallbacks` / 別名中移除/避免使用 Google 模型，讓備援不要路由到那裡。

    **LLM 要求遭拒：需要 thinking 簽章（Google Antigravity）**

    原因：工作階段歷史包含**沒有簽章的 thinking 區塊**（通常來自
    已中止/部分完成的串流）。Google Antigravity 要求 thinking 區塊具備簽章。

    修正方式：OpenClaw 現在會為 Google Antigravity Claude 移除未簽署的 thinking 區塊。如果仍然出現，請開始一個**新工作階段**，或為該代理程式設定 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：它們是什麼以及如何管理

相關：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、權杖儲存、多帳戶模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    驗證設定檔是繫結到提供者的具名認證記錄（OAuth 或 API 金鑰）。設定檔位於：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    若要在不傾印祕密的情況下檢查已儲存的設定檔，請執行 `openclaw models auth list`（可選擇加上 `--provider <id>` 或 `--json`）。詳情請參閱[模型 CLI](/zh-TW/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="典型的設定檔 ID 有哪些？">
    OpenClaw 使用帶有提供者前綴的 ID，例如：

    - `anthropic:default`（沒有電子郵件身分時常見）
    - OAuth 身分使用 `anthropic:<email>`
    - 你選擇的自訂 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制先嘗試哪個驗證設定檔嗎？">
    可以。設定支援設定檔的選用中繼資料，以及每個提供者的排序（`auth.order.<provider>`）。這**不會**儲存祕密；它會將 ID 對應到提供者/模式，並設定輪替順序。

    如果某個設定檔處於短暫**冷卻**（速率限制/逾時/驗證失敗）或較長的**停用**狀態（計費/點數不足），OpenClaw 可能會暫時跳過該設定檔。若要檢查這一點，請執行 `openclaw models status --json` 並查看 `auth.unusableProfiles`。調整項目：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷卻可以限定到模型範圍。某個設定檔若因一個模型而冷卻，
    仍可能可用於同一提供者上的同層模型，
    而計費/停用視窗仍會封鎖整個設定檔。

    你也可以透過 CLI 設定**每個代理程式**的順序覆寫（儲存在該代理程式的 `auth-state.json`）：

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    若要指定特定代理程式：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    若要確認實際會嘗試什麼，請使用：

    ```bash
    openclaw models status --probe
    ```

    如果某個已儲存的設定檔被省略在明確順序之外，probe 會針對該設定檔回報
    `excluded_by_auth_order`，而不是默默嘗試它。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有什麼差異？">
    OpenClaw 兩者都支援：

    - **OAuth** 通常會運用訂閱存取權（若適用）。
    - **API 金鑰** 使用按權杖計費。

    精靈明確支援 Anthropic Claude CLI、OpenAI Codex OAuth，以及 API 金鑰。

  </Accordion>
</AccordionGroup>

## 相關

- [FAQ](/zh-TW/help/faq) — 主要 FAQ
- [FAQ — 快速開始與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
