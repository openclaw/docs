---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉 / "所有模型皆失敗"
    - 了解驗證設定檔以及如何管理它們
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、容錯移轉和驗證設定檔
title: 常見問題：模型與身分驗證
x-i18n:
    generated_at: "2026-04-30T03:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Model 與 auth-profile 問答。關於設定、工作階段、Gateway、頻道與
  疑難排解，請參閱主要的 [FAQ](/zh-TW/help/faq)。

  ## 模型：預設值、選擇、別名、切換

  <AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    OpenClaw 的預設模型是你設定為以下項目的任何模型：

    ```
    agents.defaults.model.primary
    ```

    模型以 `provider/model` 參照（例如：`openai/gpt-5.5` 或 `openai-codex/gpt-5.5`）。如果省略 provider，OpenClaw 會先嘗試別名，接著尋找該確切模型 ID 在已設定 provider 中的唯一相符項，最後才會退回到已設定的預設 provider，這是已棄用的相容性路徑。如果該 provider 不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的 provider/model，而不是顯示已過時、已移除 provider 的預設值。你仍應該**明確**設定 `provider/model`。

  </Accordion>

  <Accordion title="你推薦哪個模型？">
    **建議預設值：**使用你的 provider stack 中可用的最強最新世代模型。
    **對於啟用工具或不受信任輸入的 agent：**優先考慮模型能力，而不是成本。
    **對於例行/低風險聊天：**使用較便宜的備用模型，並依 agent 角色路由。

    MiniMax 有自己的文件：[MiniMax](/zh-TW/providers/minimax) 和
    [本機模型](/zh-TW/gateway/local-models)。

    經驗法則：對高風險工作使用**你負擔得起的最佳模型**，對例行聊天或摘要使用較便宜的
    模型。你可以為每個 agent 路由模型，並使用 sub-agents 來
    平行處理長任務（每個 sub-agent 都會消耗 token）。請參閱 [模型](/zh-TW/concepts/models) 和
    [Sub-agents](/zh-TW/tools/subagents)。

    強烈警告：較弱/過度量化的模型更容易受到 prompt
    injection 和不安全行為影響。請參閱 [安全性](/zh-TW/gateway/security)。

    更多背景：[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    使用**模型命令**，或只編輯**模型**欄位。避免完整取代設定。

    安全選項：

    - 聊天中的 `/model`（快速、每個工作階段）
    - `openclaw models set ...`（只更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    除非你有意取代整個設定，否則避免使用帶有部分物件的 `config.apply`。
    對於 RPC 編輯，先用 `config.schema.lookup` 檢查，並優先使用 `config.patch`。lookup payload 會提供正規化路徑、淺層 schema 文件/限制，以及直接子項摘要。
    用於部分更新。
    如果你已覆寫設定，請從備份還原，或重新執行 `openclaw doctor` 修復。

    文件：[模型](/zh-TW/concepts/models)、[設定](/zh-TW/cli/configure)、[設定檔](/zh-TW/cli/config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="可以使用自託管模型（llama.cpp、vLLM、Ollama）嗎？">
    可以。Ollama 是本機模型最簡單的路徑。

    最快設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 如果你也想使用雲端模型，執行 `ollama signin`
    4. 執行 `openclaw onboard` 並選擇 `Ollama`
    5. 選擇 `Local` 或 `Cloud + Local`

    注意：

    - `Cloud + Local` 會提供雲端模型以及你的本機 Ollama 模型
    - 像 `kimi-k2.5:cloud` 這類雲端模型不需要本機拉取
    - 如需手動切換，使用 `openclaw models list` 和 `openclaw models set ollama/<model>`

    安全性注意：較小或重度量化的模型更容易受到 prompt
    injection 影響。我們強烈建議任何可使用工具的 bot 都使用**大型模型**。
    如果你仍想使用小型模型，請啟用沙箱和嚴格的工具 allowlist。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型 provider](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd 和 Krill 使用哪些模型？">
    - 這些部署可能不同，且可能隨時間變更；沒有固定的 provider 建議。
    - 使用 `openclaw models status` 檢查每個 gateway 上目前的 runtime 設定。
    - 對於安全敏感/啟用工具的 agent，使用可用的最強最新世代模型。

  </Accordion>

  <Accordion title="如何即時切換模型（不用重新啟動）？">
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

    你可以用 `/model`、`/model list` 或 `/model status` 列出可用模型。

    `/model`（和 `/model list`）會顯示精簡的編號選擇器。以數字選擇：

    ```
    /model 3
    ```

    你也可以為 provider 強制指定特定 auth profile（每個工作階段）：

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    提示：`/model status` 會顯示目前作用中的 agent、正在使用哪個 `auth-profiles.json` 檔案，以及下一個會嘗試的 auth profile。
    可用時，它也會顯示已設定的 provider endpoint（`baseUrl`）和 API 模式（`api`）。

    **如何取消固定我用 @profile 設定的 profile？**

    重新執行 `/model`，但**不要**加上 `@profile` 後綴：

    ```
    /model anthropic/claude-opus-4-6
    ```

    如果你想回到預設值，請從 `/model` 中選擇它（或送出 `/model <default provider/model>`）。
    使用 `/model status` 確認目前作用中的 auth profile。

  </Accordion>

  <Accordion title="可以日常任務用 GPT 5.5、寫程式用 Codex 5.5 嗎？">
    可以。將其中一個設為預設，並視需要切換：

    - **快速切換（每個工作階段）：**目前直接 OpenAI API 金鑰任務使用 `/model openai/gpt-5.5`，GPT-5.5 Codex OAuth 任務使用 `/model openai-codex/gpt-5.5`。
    - **預設值：**API 金鑰用法將 `agents.defaults.model.primary` 設為 `openai/gpt-5.5`，GPT-5.5 Codex OAuth 用法則設為 `openai-codex/gpt-5.5`。
    - **Sub-agents：**將寫程式任務路由到使用不同預設模型的 sub-agents。

    請參閱 [模型](/zh-TW/concepts/models) 和 [斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何為 GPT 5.5 設定快速模式？">
    使用工作階段切換，或設定預設值：

    - **每個工作階段：**當工作階段使用 `openai/gpt-5.5` 或 `openai-codex/gpt-5.5` 時送出 `/fast on`。
    - **每個模型預設值：**將 `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 或 `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` 設為 `true`。

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

    對 OpenAI 而言，在支援的原生 Responses 請求中，快速模式會對應到 `service_tier = "priority"`。工作階段 `/fast` 覆寫會優先於設定預設值。

    請參閱 [思考與快速模式](/zh-TW/tools/thinking) 和 [OpenAI 快速模式](/zh-TW/providers/openai#fast-mode)。

  </Accordion>

  <Accordion title='為什麼我會看到「Model ... is not allowed」然後沒有回覆？'>
    如果設定了 `agents.defaults.models`，它會成為 `/model` 和任何
    工作階段覆寫的 **allowlist**。選擇不在該清單中的模型會回傳：

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    該錯誤會**取代**一般回覆。修正方式：將模型加入
    `agents.defaults.models`、移除 allowlist，或從 `/model list` 選擇模型。

  </Accordion>

  <Accordion title='為什麼我會看到「Unknown model: minimax/MiniMax-M2.7」？'>
    這表示 **provider 尚未設定**（找不到 MiniMax provider 設定或 auth
    profile），因此無法解析模型。

    修正檢查清單：

    1. 升級到目前的 OpenClaw 版本（或從原始碼 `main` 執行），然後重新啟動 gateway。
    2. 確認 MiniMax 已設定（精靈或 JSON），或 MiniMax auth
       存在於 env/auth profiles 中，讓相符的 provider 可以被注入
       （`MINIMAX_API_KEY` 用於 `minimax`，`MINIMAX_OAUTH_TOKEN` 或儲存的 MiniMax
       OAuth 用於 `minimax-portal`）。
    3. 依你的 auth 路徑使用確切模型 ID（區分大小寫）：
       API 金鑰
       設定使用 `minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`，
       OAuth 設定則使用 `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 執行：

       ```bash
       openclaw models list
       ```

       並從清單中選擇（或在聊天中使用 `/model list`）。

    請參閱 [MiniMax](/zh-TW/providers/minimax) 和 [模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="可以將 MiniMax 設為預設，並將 OpenAI 用於複雜任務嗎？">
    可以。將 **MiniMax 設為預設**，並在需要時**每個工作階段**切換模型。
    fallback 是用於**錯誤**，不是用於「困難任務」，因此請使用 `/model` 或獨立 agent。

    **選項 A：每個工作階段切換**

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

    接著：

    ```
    /model gpt
    ```

    **選項 B：獨立 agent**

    - Agent A 預設值：MiniMax
    - Agent B 預設值：OpenAI
    - 依 agent 路由，或使用 `/agent` 切換

    文件：[模型](/zh-TW/concepts/models)、[多 Agent 路由](/zh-TW/concepts/multi-agent)、[MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是內建捷徑嗎？">
    是。OpenClaw 內建幾個預設縮寫（只有在模型存在於 `agents.defaults.models` 時才會套用）：

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` 用於 API 金鑰設定，或在設定為 Codex OAuth 時使用 `openai-codex/gpt-5.5`
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

    接著 `/model sonnet`（或支援時的 `/<alias>`）會解析為該模型 ID。

  </Accordion>

  <Accordion title="如何新增其他 provider 的模型，例如 OpenRouter 或 Z.AI？">
    OpenRouter（按 token 付費；許多模型）：

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

    如果你參照某個提供者/模型，但缺少必要的提供者金鑰，就會收到執行階段驗證錯誤（例如 `No API key found for provider "zai"`）。

    **新增代理程式後找不到提供者的 API 金鑰**

    這通常表示**新代理程式**的驗證儲存區是空的。驗證是依代理程式區分，並
    儲存在：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正選項：

    - 執行 `openclaw agents add <id>`，並在精靈中設定驗證。
    - 或只將可攜式靜態 `api_key` / `token` 設定檔，從主要代理程式的驗證儲存區複製到新代理程式的驗證儲存區。
    - 對於 OAuth 設定檔，當新代理程式需要自己的帳戶時，請從新代理程式登入；否則 OpenClaw 可以讀取預設/主要代理程式，而不需要複製重新整理權杖。

    **不要**跨代理程式重複使用 `agentDir`；這會造成驗證/工作階段衝突。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型都失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    容錯移轉分兩個階段發生：

    1. 同一提供者內的**驗證設定檔輪替**。
    2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

    冷卻時間會套用到失敗的設定檔（指數退避），因此即使提供者受到速率限制或暫時失敗，OpenClaw 仍可繼續回應。

    速率限制儲存桶包含的不只是單純的 `429` 回應。OpenClaw
    也會將像 `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`，以及週期性的
    使用量視窗限制（`weekly/monthly limit reached`）視為值得進行容錯移轉的
    速率限制。

    有些看起來像帳單的回應不是 `402`，而有些 HTTP `402`
    回應也會留在該暫時性儲存桶中。如果提供者在 `401` 或 `403` 回傳
    明確的帳單文字，OpenClaw 仍可將其保留在
    帳單通道中，但提供者特定的文字比對器會保持限制在擁有它們的
    提供者範圍內（例如 OpenRouter `Key limit exceeded`）。如果 `402`
    訊息反而看起來像可重試的使用量視窗或
    組織/工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），OpenClaw 會將其視為
    `rate_limit`，而不是長時間的帳單停用。

    內容溢位錯誤不同：像
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`，或 `ollama error: context length
    exceeded` 這類特徵，會停留在 Compaction/重試路徑，而不是推進模型
    備援。

    一般伺服器錯誤文字刻意比「任何包含
    unknown/error 的內容」更狹窄。OpenClaw 確實會將提供者範圍內的暫時性形態，
    例如 Anthropic 裸露的 `An unknown error occurred`、OpenRouter 裸露的
    `Provider returned error`、像 `Unhandled stop reason:
    error` 這類停止原因錯誤、帶有暫時性伺服器文字的 JSON `api_error` 酬載
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`），以及像 `ModelNotReadyException` 這類提供者忙碌錯誤，
    在提供者情境相符時，視為值得進行容錯移轉的逾時/過載訊號。
    像 `LLM request failed with an unknown
    error.` 這類一般內部備援文字會保持保守，本身不會觸發模型備援。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」是什麼意思？'>
    這表示系統嘗試使用驗證設定檔 ID `anthropic:default`，但在預期的驗證儲存區中找不到其憑證。

    **修正檢查清單：**

    - **確認驗證設定檔的位置**（新路徑與舊版路徑）
      - 目前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 舊版：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）
    - **確認你的環境變數已由 Gateway 載入**
      - 如果你在 shell 中設定 `ANTHROPIC_API_KEY`，但透過 systemd/launchd 執行 Gateway，它可能不會繼承該變數。請將它放入 `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - **確認你正在編輯正確的代理程式**
      - 多代理程式設定表示可能有多個 `auth-profiles.json` 檔案。
    - **合理性檢查模型/驗證狀態**
      - 使用 `openclaw models status` 查看已設定的模型，以及提供者是否已通過驗證。

    **「No credentials found for profile anthropic」的修正檢查清單**

    這表示執行被固定到 Anthropic 驗證設定檔，但 Gateway
    在其驗證儲存區中找不到它。

    - **使用 Claude CLI**
      - 在 Gateway 主機上執行 `openclaw models auth login --provider anthropic --method cli --set-default`。
    - **如果你想改用 API 金鑰**
      - 在 **Gateway 主機**上的 `~/.openclaw/.env` 放入 `ANTHROPIC_API_KEY`。
      - 清除任何強制使用遺失設定檔的固定順序：

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **確認你是在 Gateway 主機上執行命令**
      - 在遠端模式中，驗證設定檔位於 Gateway 機器上，而不是你的筆記型電腦上。

  </Accordion>

  <Accordion title="為什麼它也嘗試了 Google Gemini 並失敗？">
    如果你的模型設定包含 Google Gemini 作為備援（或你切換到 Gemini 簡寫），OpenClaw 會在模型備援期間嘗試它。如果你尚未設定 Google 憑證，就會看到 `No API key found for provider "google"`。

    修正：提供 Google 驗證，或移除/避免在 `agents.defaults.model.fallbacks` / 別名中使用 Google 模型，讓備援不會路由到那裡。

    **LLM 請求被拒絕：需要思考簽章（Google Antigravity）**

    原因：工作階段歷史包含**沒有簽章的思考區塊**（通常來自
    中止/部分串流）。Google Antigravity 要求思考區塊必須有簽章。

    修正：OpenClaw 現在會為 Google Antigravity Claude 移除未簽章的思考區塊。如果仍然出現，請啟動**新工作階段**，或為該代理程式設定 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：它們是什麼，以及如何管理

相關：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、權杖儲存、多帳戶模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    驗證設定檔是繫結到提供者的具名憑證記錄（OAuth 或 API 金鑰）。設定檔位於：

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="常見的設定檔 ID 有哪些？">
    OpenClaw 使用帶有提供者前綴的 ID，例如：

    - `anthropic:default`（沒有電子郵件身分時常見）
    - OAuth 身分的 `anthropic:<email>`
    - 你選擇的自訂 ID（例如 `anthropic:work`）

  </Accordion>

  <Accordion title="我可以控制先嘗試哪個驗證設定檔嗎？">
    可以。設定支援設定檔的選用中繼資料，以及每個提供者的順序（`auth.order.<provider>`）。這**不會**儲存祕密；它會將 ID 對應到提供者/模式，並設定輪替順序。

    如果設定檔處於短暫**冷卻**（速率限制/逾時/驗證失敗）或較長的**停用**狀態（帳單/點數不足），OpenClaw 可能會暫時略過該設定檔。若要檢查，請執行 `openclaw models status --json` 並查看 `auth.unusableProfiles`。調整：`auth.cooldowns.billingBackoffHours*`。

    速率限制冷卻可以限定到模型範圍。某個設定檔若正在為
    一個模型冷卻，仍可供同一提供者上的兄弟模型使用，
    而帳單/停用視窗仍會阻擋整個設定檔。

    你也可以透過 CLI 設定**每個代理程式**的順序覆寫（儲存在該代理程式的 `auth-state.json` 中）：

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

    若要驗證實際會嘗試什麼，請使用：

    ```bash
    openclaw models status --probe
    ```

    如果儲存的設定檔被明確順序省略，探測會對該設定檔回報
    `excluded_by_auth_order`，而不是默默嘗試它。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有什麼差異？">
    OpenClaw 兩者皆支援：

    - **OAuth** 通常會利用訂閱存取權（在適用處）。
    - **API 金鑰**使用按權杖付費的計費方式。

    精靈明確支援 Anthropic Claude CLI、OpenAI Codex OAuth，以及 API 金鑰。

  </Accordion>
</AccordionGroup>

## 相關

- [FAQ](/zh-TW/help/faq) — 主要 FAQ
- [FAQ — 快速開始與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
