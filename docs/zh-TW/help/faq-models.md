---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉 /「所有模型皆失敗」
    - 了解驗證設定檔及其管理方式
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、容錯移轉和驗證設定檔
title: FAQ：模型與驗證
x-i18n:
    generated_at: "2026-07-05T11:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  模型與驗證設定檔問答。若需設定、工作階段、閘道、頻道與疑難排解，請參閱主要的 [FAQ](/zh-TW/help/faq)。

  ## 模型：預設值、選擇、別名、切換

  <AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    使用以下項目設定：

    ```text
    agents.defaults.model.primary
    ```

    模型是 `provider/model` 參照（範例：`openai/gpt-5.5`、
    `anthropic/claude-sonnet-4-6`）。請一律明確設定 `provider/model`。如果
    省略提供者，OpenClaw 會先嘗試比對別名，接著比對該模型 id 的唯一
    已設定提供者，然後退回到已設定的預設提供者（已淘汰的相容性路徑）。如果該
    提供者不再有已設定的預設模型，OpenClaw 會改為退回到第一個已設定的
    提供者/模型，而不是過時的預設值。

  </Accordion>

  <Accordion title="你建議使用哪個模型？">
    使用你的提供者堆疊所提供的最強最新世代模型，
    尤其是啟用工具或處理不受信任輸入的代理程式；較弱或
    過度量化的模型更容易受到提示注入與不安全
    行為影響（請參閱[安全性](/zh-TW/gateway/security)）。依代理程式角色將較便宜的模型路由到
    例行/低風險聊天。

    依代理程式路由模型，並使用子代理程式平行處理長任務（每個
    子代理程式都會消耗自己的權杖）。請參閱[模型](/zh-TW/concepts/models)、
    [子代理程式](/zh-TW/tools/subagents)、[MiniMax](/zh-TW/providers/minimax) 與
    [本機模型](/zh-TW/gateway/local-models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    只變更模型欄位，避免完整取代設定。

    - 聊天中的 `/model`（每個工作階段，請參閱[斜線命令](/zh-TW/tools/slash-commands)）
    - `openclaw models set ...`（只更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 直接編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    對於 RPC 編輯，請先使用 `config.schema.lookup` 檢查（正規化
    路徑、淺層結構描述文件、子項摘要），然後優先使用 `config.patch`
    而不是搭配部分物件使用 `config.apply`。如果你確實覆寫了設定，
    請從備份還原或執行 `openclaw doctor` 來修復。

    文件：[模型](/zh-TW/concepts/models)、[設定](/zh-TW/cli/configure)、
    [設定檔](/zh-TW/cli/config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我可以使用自架模型（llama.cpp、vLLM、Ollama）嗎？">
    可以，Ollama 是最簡單的路徑。快速設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 若也要使用雲端模型，請執行 `ollama signin`
    4. 執行 `openclaw onboard`，選擇 `Ollama`，然後選擇 `Local` 或 `Cloud + Local`

    `Cloud + Local` 會提供雲端模型加上你的本機 Ollama 模型；
    `kimi-k2.5:cloud` 等雲端模型不需要本機拉取。若要手動切換：
    `openclaw models list`，然後 `openclaw models set ollama/<model>`。

    較小/高度量化的模型更容易受到提示注入影響。
    對任何具備工具存取權的機器人使用大型模型；如果仍然使用小型模型，
    請啟用沙箱化與嚴格的工具允許清單。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型提供者](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱化](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="如何即時切換模型（不重新啟動）？">
    將 `/model <name>` 作為獨立訊息傳送。請參閱
    [斜線命令](/zh-TW/tools/slash-commands)以取得
    完整命令清單，包括編號選擇器（`/model`、`/model
    list`、`/model 3`）、用於清除工作階段覆寫的 `/model default`，以及
    用於端點/API 模式詳細資訊的 `/model status`。

    使用 `@profile` 強制每個工作階段使用特定驗證設定檔：

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    若要取消釘選以 `@profile` 設定的設定檔，請在不加
    後綴的情況下重新執行 `/model`（例如 `/model anthropic/claude-opus-4-6`），或從
    `/model` 選擇預設值。使用 `/model status` 確認作用中的驗證設定檔。

  </Accordion>

  <Accordion title="如果兩個提供者公開相同的模型 id，/model 會使用哪一個？">
    `/model provider/model` 會選擇該確切提供者路由。例如，
    `qianfan/deepseek-v4-flash` 和 `deepseek/deepseek-v4-flash` 是不同的
    參照，即使模型 id 相同，OpenClaw 也不會在裸 id 相符時靜默切換
    提供者。

    使用者選取的 `/model` 參照在備援時是嚴格的：如果該
    提供者/模型變得不可用，回覆會明確失敗，而不是
    退回到 `agents.defaults.model.fallbacks`。已設定的備援
    鏈仍會套用到已設定的預設值、排程工作主要模型與
    自動選取的備援狀態。當非工作階段覆寫的執行允許
    使用備援時，OpenClaw 會先嘗試要求的提供者/模型，接著
    嘗試已設定的備援，最後才是已設定的主要模型，因此重複的裸
    模型 id 永遠不會直接跳回預設提供者。

    請參閱[模型](/zh-TW/concepts/models)與[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>

  <Accordion title="我可以將 GPT 5.5 用於日常任務，將 Codex 5.5 用於寫程式嗎？">
    可以，模型選擇與執行階段選擇是分開的：

    - **原生 Codex 程式設計代理程式：** 將 `agents.defaults.model.primary` 設為
      `openai/gpt-5.5`。使用 `openclaw models auth login --provider
      openai` 登入，以使用 ChatGPT/Codex 訂閱驗證。
    - **代理程式迴圈之外的直接 OpenAI API 任務：** 為圖像、嵌入、語音、即時與其他
      非代理程式 OpenAI API 介面設定
      `OPENAI_API_KEY`。
    - **OpenAI 代理程式 API 金鑰驗證：** `/model openai/gpt-5.5` 搭配已排序的
      `openai` API 金鑰設定檔。
    - **子代理程式：** 將程式設計任務路由到專注於 Codex 的代理程式，並使用其
      自己的 `openai/gpt-5.5` 模型。

    請參閱[模型](/zh-TW/concepts/models)與[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何為 GPT 5.5 設定快速模式？">
    - **每個工作階段：** 使用 `openai/gpt-5.5` 時傳送 `/fast on`。
    - **每個模型預設值：** 將
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 設為 `true`。
    - **自動截止：** `/fast auto` 或 `params.fastMode: "auto"` 會讓新的
      模型呼叫快速執行直到截止時間，之後的重試、備援、
      工具結果或延續呼叫則不使用快速模式。截止時間預設為
      60 秒；可在模型上使用 `params.fastAutoOnSeconds` 覆寫。

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

    快速模式會對應到原生 OpenAI Responses
    要求上的 `service_tier = "priority"`；既有的 `service_tier` 值會保留，且快速模式不會
    重寫 `reasoning` 或 `text.verbosity`。工作階段 `/fast` 覆寫優先於
    設定預設值。

    請參閱[思考與快速模式](/zh-TW/tools/thinking)，以及
    [OpenAI](/zh-TW/providers/openai) 提供者頁面上進階設定下的快速模式章節。

  </Accordion>

  <Accordion title='為什麼我會看到「Model ... is not allowed」，然後沒有回覆？'>
    如果設定了 `agents.defaults.models`，它會成為
    `/model` 與工作階段覆寫的**允許清單**。選擇清單外的模型會
    回傳以下內容，而不是一般回覆：

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    修正方式：將確切模型加入 `agents.defaults.models`、為動態目錄加入
    `"provider/*": {}` 這類提供者
    萬用字元、移除允許清單，或從 `/model list` 選擇模型。如果命令也
    包含 `--runtime codex`，請先更新允許清單，然後重試相同的
    `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='為什麼我會看到「Unknown model: minimax/MiniMax-M3」？'>
    如果你使用的是較舊的 OpenClaw 版本，請先升級（或從原始碼
    `main` 執行）並重新啟動閘道；`MiniMax-M3` 可能尚未在你
    已安裝版本的目錄中。否則就是 MiniMax 提供者尚未
    設定（找不到提供者項目或驗證設定檔），因此模型無法
    解析。完整修正檢查清單、提供者/模型 id 表格與設定區塊範例，請參閱
    [MiniMax](/zh-TW/providers/minimax) 提供者頁面上的疑難排解章節。

  </Accordion>

  <Accordion title="我可以將 MiniMax 作為預設，並將 OpenAI 用於複雜任務嗎？">
    可以。使用 MiniMax 作為預設，並依工作階段切換模型；備援
    是用於錯誤，而不是「困難任務」，因此請使用 `/model` 或另一個代理程式。

    **選項 A：依工作階段切換**

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

    然後 `/model gpt`。

    **選項 B：分開的代理程式** — 代理程式 A 預設使用 MiniMax，代理程式 B
    預設使用 OpenAI；依代理程式路由或使用 `/agent` 切換。

    文件：[模型](/zh-TW/concepts/models)、[多代理程式路由](/zh-TW/concepts/multi-agent)、
    [MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt 是內建捷徑嗎？">
    是，這些是內建簡寫，僅在目標模型存在於
    `agents.defaults.models` 時套用：

    | 別名 | 解析為 |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    你自己的同名別名會覆寫內建別名。

  </Accordion>

  <Accordion title="如何定義/覆寫模型捷徑（別名）？">
    別名位於 `agents.defaults.models.<modelId>.alias`：

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

    接著 `/model sonnet`（或支援時的 `/<alias>`）會解析為該
    模型 id。

  </Accordion>

  <Accordion title="如何新增來自 OpenRouter 或 Z.AI 等其他提供者的模型？">
    OpenRouter（按權杖付費；多種模型）：

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    參照的提供者/模型若缺少提供者金鑰，會引發執行階段
    驗證錯誤（例如 `No API key found for provider "zai"`）。

    **新增代理程式後找不到提供者的 API 金鑰**

    新代理程式的驗證儲存區是空的；驗證是每個代理程式各自獨立，儲存在：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正：執行 `openclaw agents add <id>` 並在精靈中設定驗證，或只從主要
    代理程式的儲存區複製可攜式靜態 `api_key`/`token` 設定檔。若使用 OAuth，當新的代理程式需要自己的
    帳號時，請從該代理程式登入。完整的 `agentDir` 重用與憑證共用規則，請參閱 [多代理程式路由](/zh-TW/concepts/multi-agent)；絕對不要在代理程式之間重用
    `agentDir`。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型皆失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    分成兩個階段：

    1. 在同一提供者內進行**驗證設定檔輪替**。
    2. **模型備援**到 `agents.defaults.model.fallbacks` 中的下一個模型。

    冷卻時間會套用到失敗的設定檔（指數退避），因此當提供者受到速率限制或暫時失敗時，OpenClaw
    仍可繼續回應。

    速率限制 bucket 涵蓋的範圍不只普通的 `429`：`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`，以及週期性的
    使用量時段限制（`weekly/monthly limit reached`）都會算作
    值得容錯移轉的速率限制。

    帳務回應不一定總是 `402`，且某些 `402` 會留在
    暫時性/速率限制 bucket，而不是帳務通道。`401`/`403` 上的明確
    帳務文字仍可路由到帳務；提供者特定的
    文字比對器（例如 OpenRouter `Key limit exceeded`）仍限定在各自的
    提供者範圍內。若 `402` 看起來像可重試的使用量時段或
    組織/工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），會被視為 `rate_limit`，而不是
    長時間的帳務停用。

    上下文溢位錯誤會完全避開備援路徑；像是
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、`input is
    too long for the model`，或 `ollama error: context length exceeded` 這類特徵會進入
    壓縮/重試，而不是推進模型備援。

    通用伺服器錯誤文字的範圍比「任何包含 unknown/error 的內容」
    更窄。會算作容錯移轉
    訊號的提供者限定暫時性形態包括：Anthropic 裸 `An unknown error occurred`、OpenRouter 裸
    `Provider returned error`、像 `Unhandled stop reason:
    error` 這類停止原因錯誤、含暫時性伺服器文字（`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`）的 JSON `api_error` 酬載，
    以及在提供者
    上下文相符時，像 `ModelNotReadyException` 這類提供者忙碌錯誤。像 `LLM request failed
    with an unknown error.` 這種通用內部備援文字會保持保守，單靠它本身不會觸發備援。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」是什麼意思？'>
    驗證設定檔 ID `anthropic:default` 在預期的驗證儲存區中沒有憑證。

    **修正檢查清單：**

    - 確認設定檔所在位置；目前為：
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`；舊版為：
      `~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。
    - 確認閘道有載入你的環境變數。只在
      你的 shell 中設定 `ANTHROPIC_API_KEY`，不會傳到透過 systemd/launchd 執行的閘道；請放到
      `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - 確認你正在編輯正確的代理程式；多代理程式設定會有
      多個 `auth-profiles.json` 檔案。
    - 執行 `openclaw models status` 以查看已設定模型與提供者
      驗證狀態。

    **對於「No credentials found for profile anthropic」（沒有電子郵件後綴）：**

    這次執行被固定到閘道找不到的 Anthropic 設定檔。

    - 使用 Claude 命令列介面：在閘道主機上執行 `openclaw models auth login --provider anthropic
      --method cli --set-default`。
    - 若偏好使用 API 金鑰：在閘道主機上的
      `~/.openclaw/.env` 放入 `ANTHROPIC_API_KEY`，然後清除任何會強制使用缺失設定檔的固定順序：

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - 遠端模式：驗證設定檔存在於閘道機器上，而不是你的
      筆電；請確認你是在那台機器上執行命令。

  </Accordion>

  <Accordion title="為什麼它也嘗試 Google Gemini 並失敗？">
    如果你的模型設定包含 Google Gemini 作為備援（或你
    切換到 Gemini 簡寫），OpenClaw 會在備援期間嘗試它。未設定
    Google 憑證時會得到 `No API key found for provider
    "google"`。修正：新增 Google 驗證，或從
    `agents.defaults.model.fallbacks`/別名中移除 Google 模型。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因：工作階段歷史有沒有簽章的 thinking 區塊（通常
    來自中止/部分串流）；Google Antigravity 要求 thinking 區塊
    具備簽章。OpenClaw 會為 Google
    Antigravity Claude 移除未簽章的 thinking 區塊；若它仍然出現，請開始新的工作階段，或為該代理程式設定
    `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：它們是什麼，以及如何管理

相關：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、token 儲存、多帳號模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    與提供者綁定的具名憑證記錄（OAuth 或 API 金鑰），儲存在：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    不傾印機密即可檢查已儲存的設定檔：`openclaw models auth
    list`（可選擇搭配 `--provider <id>` 或 `--json`）。請參閱
    [模型命令列介面](/zh-TW/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="常見的設定檔 ID 有哪些？">
    提供者前綴：`anthropic:default`（沒有電子郵件身分時常見）、OAuth 身分使用
    `anthropic:<email>`，或你選擇的自訂 ID
    （例如 `anthropic:work`）。

  </Accordion>

  <Accordion title="我可以控制先嘗試哪個驗證設定檔嗎？">
    可以。`auth.order.<provider>` 設定會為每個提供者設定輪替順序
    （僅中繼資料；不儲存機密）。

    OpenClaw 可能會略過處於短暫**冷卻**狀態的設定檔（速率限制、
    逾時、驗證失敗），或處於較長**停用**狀態的設定檔
    （帳務/點數不足）。使用 `openclaw models status
    --json` 檢查，並查看 `auth.unusableProfiles`。可透過
    `auth.cooldowns.billingBackoffHours*` 調整。速率限制冷卻可以是
    模型範圍；某個模型正在冷卻的設定檔仍可服務同一提供者上的
    兄弟模型；帳務/停用視窗會封鎖
    整個設定檔。

    設定每個代理程式的順序覆寫（儲存在該代理程式的 `auth-state.json` 中）：

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    驗證實際會嘗試什麼：`openclaw models status --probe`。若已儲存的設定檔被明確順序省略，會回報
    `excluded_by_auth_order`，而不是默默嘗試。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有什麼差異？">
    - **OAuth / 命令列介面登入**通常會在提供者支援時使用訂閱存取權。對 Anthropic 而言，OpenClaw 的 Claude 命令列介面後端
      使用 Claude Code `claude -p`，Anthropic 目前將其視為
      Agent SDK/程式化使用量，從訂閱使用量限制扣除；
      目前的帳務暫停狀態與來源連結，請參閱 [Anthropic](/zh-TW/providers/anthropic)。
    - **API 金鑰**使用按 token 計費。

    精靈支援 Anthropic Claude 命令列介面、OpenAI Codex OAuth 與 API
    金鑰。

  </Accordion>
</AccordionGroup>

## 相關

- [常見問題](/zh-TW/help/faq) — 主要常見問題
- [常見問題 — 快速開始與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
