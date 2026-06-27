---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉 /「所有模型皆失敗」
    - 了解驗證設定檔及其管理方式
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、故障轉移與驗證設定檔
title: 常見問題：模型與身分驗證
x-i18n:
    generated_at: "2026-06-27T19:24:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  模型與驗證設定檔問答。關於設定、工作階段、閘道、通道與
  疑難排解，請參閱主要的[常見問題](/zh-TW/help/faq)。

  ## 模型：預設值、選擇、別名、切換

  <AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    OpenClaw 的預設模型就是你設定為以下項目的模型：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 參照（例如：`openai/gpt-5.5` 或 `anthropic/claude-sonnet-4-6`）。如果你省略提供者，OpenClaw 會先嘗試別名，接著嘗試與該精確模型 id 相符且唯一的已設定提供者，最後才退回到已設定的預設提供者，這是已棄用的相容性路徑。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的提供者/模型，而不是顯示過時且已移除提供者的預設值。你仍應該**明確**設定 `provider/model`。

  </Accordion>

  <Accordion title="你推薦哪個模型？">
    **建議預設值：**使用你的提供者堆疊中可用、最強的最新世代模型。
    **對於啟用工具或處理不受信任輸入的代理：**優先考量模型能力，而不是成本。
    **對於例行/低風險聊天：**使用較便宜的備援模型，並依代理角色路由。

    MiniMax 有自己的文件：[MiniMax](/zh-TW/providers/minimax) 和
    [本機模型](/zh-TW/gateway/local-models)。

    經驗法則：高風險工作使用**你負擔得起的最佳模型**，例行聊天或摘要則使用較便宜的
    模型。你可以按代理路由模型，並使用子代理平行處理長任務（每個子代理都會消耗權杖）。請參閱[模型](/zh-TW/concepts/models)和
    [子代理](/zh-TW/tools/subagents)。

    強烈警告：較弱或過度量化的模型更容易受到提示
    注入與不安全行為影響。請參閱[安全性](/zh-TW/gateway/security)。

    更多背景：[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    使用**模型命令**，或只編輯**模型**欄位。避免完整替換設定。

    安全選項：

    - 聊天中的 `/model`（快速、按工作階段）
    - `openclaw models set ...`（只更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你打算替換整個設定，否則避免用部分物件呼叫 `config.apply`。
    對於 RPC 編輯，請先用 `config.schema.lookup` 檢查，並優先使用 `config.patch`。查詢承載會提供正規化路徑、淺層結構描述文件/限制，以及直接子項摘要，
    供部分更新使用。
    如果你確實覆寫了設定，請從備份還原，或重新執行 `openclaw doctor` 進行修復。

    文件：[模型](/zh-TW/concepts/models)、[設定](/zh-TW/cli/configure)、[設定檔](/zh-TW/cli/config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自架模型（llama.cpp、vLLM、Ollama）嗎？">
    可以。Ollama 是使用本機模型最簡單的路徑。

    最快速設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 如果你也想使用雲端模型，請執行 `ollama signin`
    4. 執行 `openclaw onboard` 並選擇 `Ollama`
    5. 選擇 `Local` 或 `Cloud + Local`

    注意事項：

    - `Cloud + Local` 會提供雲端模型加上你的本機 Ollama 模型
    - `kimi-k2.5:cloud` 等雲端模型不需要本機拉取
    - 若要手動切換，請使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全性注意事項：較小或大量量化的模型更容易受到提示
    注入影響。對於任何可以使用工具的機器人，我們強烈建議使用**大型模型**。
    如果你仍想使用小型模型，請啟用沙箱與嚴格的工具允許清單。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型提供者](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用哪些模型？">
    - 這些部署可能不同，且可能隨時間變更；沒有固定的提供者建議。
    - 使用 `openclaw models status` 檢查每個閘道目前的執行階段設定。
    - 對於安全性敏感或啟用工具的代理，請使用可用、最強的最新世代模型。

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

    這些是內建別名。可透過 `agents.defaults.models` 新增自訂別名。

    你可以使用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（以及 `/model list`）會顯示精簡的編號選擇器。依編號選擇：

    ```
    /model 3
    ```

    你也可以強制為該提供者指定特定驗證設定檔（按工作階段）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 會顯示目前作用中的代理、正在使用哪個 `auth-profiles.json` 檔案，以及接下來會嘗試哪個驗證設定檔。
    可用時，它也會顯示已設定的提供者端點（`baseUrl`）與 API 模式（`api`）。

    **如何取消釘選我用 @profile 設定的設定檔？**

    重新執行 `/model`，但**不要**加上 `@profile` 後綴：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到預設值，請從 `/model` 選擇它（或傳送 `/model <default provider/model>`）。
    使用 `/model status` 確認目前作用中的驗證設定檔。

  </Accordion>

  <Accordion title="如果兩個提供者公開相同的模型 id，/model 會使用哪一個？">
    `/model provider/model` 會為該工作階段選擇精確的提供者路由。

    例如，`qianfan/deepseek-v4-flash` 和 `deepseek/deepseek-v4-flash` 是不同的模型參照，即使兩者都包含 `deepseek-v4-flash`。OpenClaw 不應只因裸模型 id 相符，就靜默地從一個提供者切換到另一個。

    使用者選取的 `/model` 參照也會嚴格套用備援政策。如果該選定的提供者/模型不可用，回覆會明確失敗，而不是從 `agents.defaults.model.fallbacks` 回答。已設定的備援鏈仍適用於已設定的預設值、排程工作的主要模型，以及自動選取的備援狀態。

    如果從非工作階段覆寫啟動的執行允許使用備援，OpenClaw 會先嘗試要求的提供者/模型，接著嘗試已設定的備援，最後才嘗試已設定的主要模型。這可防止重複的裸模型 id 直接跳回預設提供者。

    請參閱[模型](/zh-TW/concepts/models)和[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>

  <Accordion title="我可以日常任務使用 GPT 5.5，編碼使用 Codex 5.5 嗎？">
    可以。請將模型選擇與執行階段選擇分開處理：

    - **原生 Codex 編碼代理：**將 `agents.defaults.model.primary` 設為 `openai/gpt-5.5`。當你想使用 ChatGPT/Codex 訂閱驗證時，請用 `openclaw models auth login --provider openai` 登入。
    - **代理迴圈外的直接 OpenAI API 任務：**為圖片、嵌入、語音、即時，以及其他非代理 OpenAI API 介面設定 `OPENAI_API_KEY`。
    - **OpenAI 代理 API 金鑰驗證：**使用 `/model openai/gpt-5.5` 搭配排序過的 `openai` API 金鑰設定檔。
    - **子代理：**將編碼任務路由到擁有自己 `openai/gpt-5.5` 模型、專注於 Codex 的代理。

    請參閱[模型](/zh-TW/concepts/models)和[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何為 GPT 5.5 設定快速模式？">
    使用工作階段切換或設定預設值：

    - **按工作階段：**在工作階段使用 `openai/gpt-5.5` 時傳送 `/fast on`。
    - **按模型預設值：**將 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 設為 `true`。
    - **自動截止：**使用 `/fast auto` 或 `params.fastMode: "auto"`，讓新的模型呼叫在自動截止前以快速模式開始，之後的重試、備援、工具結果或延續呼叫則不使用快速模式。截止預設為 60 秒；在作用中的模型上設定 `params.fastAutoOnSeconds` 可變更它。

    範例：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    對於 OpenAI，快速模式會在支援的原生 Responses 請求上對應到 `service_tier = "priority"`。工作階段 `/fast` 覆寫會優先於設定預設值。Codex app-server 回合只能在回合開始時接收層級，因此 `auto` 會套用到下一個由 OpenClaw 啟動的模型回合，而不是已在執行中的 app-server 回合內。

    請參閱[思考與快速模式](/zh-TW/tools/thinking)和 [OpenAI 快速模式](/zh-TW/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='為什麼我看到「Model ... is not allowed」後就沒有回覆？'>
    如果設定了 `agents.defaults.models`，它就會成為 `/model` 與任何
    工作階段覆寫的**允許清單**。選擇不在該清單中的模型會回傳：

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    該錯誤會**取代**一般回覆而被傳回。修正方式：將精確模型加入
    `agents.defaults.models`、為動態提供者目錄新增類似 `"provider/*": {}` 的提供者萬用字元、移除允許清單，或從 `/model list` 選擇模型。
    如果命令也包含 `--runtime codex`，請先更新允許清單，然後重試
    相同的 `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='為什麼我看到「Unknown model: minimax/MiniMax-M3」？'>
    這表示**提供者尚未設定**（找不到 MiniMax 提供者設定或驗證
    設定檔），因此無法解析該模型。

    修正檢查清單：

    1. 升級到目前的 OpenClaw 版本（或從原始碼 `main` 執行），然後重新啟動閘道。
    2. 確認 MiniMax 已設定（精靈或 JSON），或 env/驗證設定檔中存在 MiniMax 驗證，
       使相符的提供者可以被注入
       （`minimax` 使用 `MINIMAX_API_KEY`，`minimax-portal` 使用 `MINIMAX_OAUTH_TOKEN` 或已儲存的 MiniMax
       OAuth）。
    3. 針對你的驗證路徑使用精確模型 id（區分大小寫）：
       API 金鑰設定使用 `minimax/MiniMax-M3`、`minimax/MiniMax-M2.7` 或
       `minimax/MiniMax-M2.7-highspeed`，OAuth 設定則使用
       `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7` 或
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 執行：

       ```bash
       openclaw models list
       ```

       並從清單中選擇（或在聊天中使用 `/model list`）。

    請參閱 [MiniMax](/zh-TW/providers/minimax) 和[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以將 MiniMax 設為預設，並用 OpenAI 處理複雜任務嗎？">
    可以。將 **MiniMax 設為預設**，並在需要時**按工作階段**切換模型。
    備援用於**錯誤**，不是用於「困難任務」，因此請使用 `/model` 或獨立代理。

    **選項 A：按工作階段切換**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    **選項 B：獨立代理**

    - 代理 A 預設值：MiniMax
    - 代理 B 預設值：OpenAI
    - 依代理路由，或使用 `/agent` 切換

    Docs：[模型](/zh-TW/concepts/models)、[多代理路由](/zh-TW/concepts/multi-agent)、[MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是內建捷徑嗎？">
    是。OpenClaw 內建幾個預設簡寫（只有在模型存在於 `agents.defaults.models` 時才會套用）：

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

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
          },
        },
      },
    }
    ```

    接著 `/model sonnet`（或在支援時使用 `/<alias>`）會解析為該模型 ID。

  </Accordion>

  <Accordion title="如何新增來自其他提供者（例如 OpenRouter 或 Z.AI）的模型？">
    OpenRouter（依 token 計費；模型眾多）：

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

    如果你參照某個提供者/模型，但缺少必要的提供者金鑰，會收到執行階段驗證錯誤（例如 `No API key found for provider "zai"`）。

    **新增代理後找不到提供者的 API 金鑰**

    這通常表示**新代理**的驗證儲存區是空的。驗證是依代理區分，並儲存在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正選項：

    - 執行 `openclaw agents add <id>`，並在精靈中設定驗證。
    - 或只把可攜的靜態 `api_key` / `token` 設定檔，從主要代理的驗證儲存區複製到新代理的驗證儲存區。
    - 對於 OAuth 設定檔，當新代理需要自己的帳戶時，從新代理登入；否則 OpenClaw 可以讀取預設/主要代理，而不必複製更新權杖。

    請**不要**在多個代理之間重複使用 `agentDir`；這會造成驗證/工作階段衝突。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型都失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    容錯移轉分兩個階段：

    1. 在同一個提供者內**輪替驗證設定檔**。
    2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

    冷卻時間會套用到失敗的設定檔（指數退避），因此即使提供者受到速率限制或暫時故障，OpenClaw 仍可繼續回應。

    速率限制的分類不只包含單純的 `429` 回應。OpenClaw
    也會將 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及週期性
    用量視窗限制（`weekly/monthly limit reached`）這類訊息視為值得容錯移轉的
    速率限制。

    有些看起來像帳務的回應不是 `402`，而有些 HTTP `402`
    回應也會留在暫時性分類中。如果提供者在 `401` 或 `403` 回傳
    明確的帳務文字，OpenClaw 仍可將其保留在
    帳務通道中，但提供者特定的文字比對器會限定在擁有它們的
    提供者範圍內（例如 OpenRouter `Key limit exceeded`）。如果 `402`
    訊息反而看起來像可重試的用量視窗或
    組織/工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 會將其視為
    `rate_limit`，而不是長期帳務停用。

    上下文溢位錯誤不同：像是
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`，或 `ollama error: context length
    exceeded` 這類特徵，會留在壓縮/重試路徑上，而不會推進模型
    備援。

    一般伺服器錯誤文字的判定刻意比「任何包含
    unknown/error 的內容」更窄。OpenClaw 確實會在提供者情境
    相符時，將提供者範圍內的暫時性形狀，例如 Anthropic 裸露的 `An unknown error occurred`、OpenRouter 裸露的
    `Provider returned error`、停止原因錯誤（如 `Unhandled stop reason:
    error`）、帶有暫時性伺服器文字的 JSON `api_error` 承載
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及 `ModelNotReadyException` 這類提供者忙碌錯誤，視為
    值得容錯移轉的逾時/過載訊號。
    像 `LLM request failed with an unknown
    error.` 這類一般內部備援文字會保持保守，不會單獨觸發模型備援。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」是什麼意思？'>
    這表示系統嘗試使用驗證設定檔 ID `anthropic:default`，但在預期的驗證儲存區中找不到它的憑證。

    **修正檢查清單：**

    - **確認驗證設定檔存放位置**（新路徑與舊路徑）
      - 目前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 舊版：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）
    - **確認你的環境變數已由閘道載入**
      - 如果你在 shell 中設定 `ANTHROPIC_API_KEY`，但透過 systemd/launchd 執行閘道，它可能不會繼承該變數。請把它放在 `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - **確認你正在編輯正確的代理**
      - 多代理設定表示可能會有多個 `auth-profiles.json` 檔案。
    - **對模型/驗證狀態做基本檢查**
      - 使用 `openclaw models status` 查看已設定的模型，以及提供者是否已驗證。

    **「No credentials found for profile anthropic」的修正檢查清單**

    這表示此次執行被固定到某個 Anthropic 驗證設定檔，但閘道
    在其驗證儲存區中找不到該設定檔。

    - **使用 Claude 命令列介面**
      - 在閘道主機上執行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 金鑰**
      - 將 `ANTHROPIC_API_KEY` 放在**閘道主機**上的 `~/.openclaw/.env`。
      - 清除任何會強制使用缺失設定檔的固定順序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **確認你是在閘道主機上執行命令**
      - 在遠端模式下，驗證設定檔存在於閘道機器上，而不是你的筆記型電腦上。

  </Accordion>

  <Accordion title="為什麼它也嘗試了 Google Gemini 並失敗？">
    如果你的模型設定包含 Google Gemini 作為備援（或你切換到 Gemini 簡寫），OpenClaw 會在模型備援期間嘗試它。如果你尚未設定 Google 憑證，會看到 `No API key found for provider "google"`。

    修正方式：提供 Google 驗證，或移除/避免在 `agents.defaults.model.fallbacks` / 別名中使用 Google 模型，讓備援不會路由到那裡。

    **LLM 請求遭拒：需要 thinking 簽章（Google Antigravity）**

    原因：工作階段歷史包含**沒有簽章的 thinking 區塊**（通常來自
    中止/部分串流）。Google Antigravity 要求 thinking 區塊必須有簽章。

    修正：OpenClaw 現在會為 Google Antigravity Claude 移除未簽章的 thinking 區塊。如果仍然出現，請開始一個**新工作階段**，或為該代理設定 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：它們是什麼以及如何管理

相關：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、權杖儲存、多帳戶模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    驗證設定檔是綁定到提供者的具名憑證記錄（OAuth 或 API 金鑰）。設定檔存放於：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    若要檢視已儲存的設定檔而不輸出祕密，請執行 `openclaw models auth list`（可選用 `--provider <id>` 或 `--json`）。詳情請參閱[模型命令列介面](/zh-TW/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="典型的設定檔 ID 有哪些？">
    OpenClaw 使用帶有提供者前綴的 ID，例如：

    - `anthropic:default`（沒有電子郵件身分時很常見）
    - `anthropic:<email>` 用於 OAuth 身分
    - 你選擇的自訂 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制先嘗試哪個驗證設定檔嗎？">
    可以。設定支援設定檔的選用中繼資料，以及每個提供者的排序（`auth.order.<provider>`）。這**不會**儲存祕密；它會將 ID 對應到提供者/模式，並設定輪替順序。

    如果某個設定檔處於短暫**冷卻**（速率限制/逾時/驗證失敗）或較長的**停用**狀態（帳務/點數不足），OpenClaw 可能會暫時跳過它。若要檢查這一點，請執行 `openclaw models status --json` 並檢查 `auth.unusableProfiles`。調整項目：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷卻可以是模型範圍。某個設定檔若是因
    某個模型而冷卻，同一提供者上的同級模型仍可使用它；
    而帳務/停用視窗仍會封鎖整個設定檔。

    你也可以透過命令列介面設定**每個代理**的順序覆寫（儲存在該代理的 `auth-state.json` 中）：

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

    若要指定特定代理：

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    若要驗證實際會嘗試什麼，請使用：

    ```bash
    openclaw models status --probe
    ```

    如果儲存的設定檔被排除在明確順序之外，探測會對該設定檔回報
    `excluded_by_auth_order`，而不是默默嘗試它。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有什麼差異？">
    OpenClaw 兩者都支援：

    - **OAuth / 命令列介面登入**通常會在提供者支援時利用訂閱存取。對 Anthropic 而言，OpenClaw 的 Claude 命令列介面後端使用
      Claude Code `claude -p`；Anthropic 目前將其視為 Agent
      SDK/程式化使用，並自 2026 年 6 月 15 日起提供單獨的每月 Agent SDK 點數。
    - **API 金鑰**採用依 token 計費。

    精靈明確支援 Anthropic Claude 命令列介面、OpenAI Codex OAuth，以及 API 金鑰。

  </Accordion>
</AccordionGroup>

## 相關

- [FAQ](/zh-TW/help/faq) — 主要 FAQ
- [FAQ — 快速入門與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
