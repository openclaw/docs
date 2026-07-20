---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉／「所有模型皆失敗」
    - 瞭解身分驗證設定檔及其管理方式
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、容錯移轉與驗證設定檔
title: 常見問題：模型與驗證
x-i18n:
    generated_at: "2026-07-20T00:49:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73272916f3db17d101c777639c5a5153bfbcfa887929a5726f3c94c3cb29aaf9
    source_path: help/faq-models.md
    workflow: 16
---

模型與驗證設定檔問答。關於設定、工作階段、閘道、頻道及
疑難排解，請參閱主要的[常見問題](/zh-TW/help/faq)。

## 模型：預設值、選擇、別名與切換

<AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    使用以下項目設定：

    ```text
    agents.defaults.model.primary
    ```

    模型是 `provider/model` 參照（例如：`openai/gpt-5.5`、
    `anthropic/claude-sonnet-4-6`）。務必明確設定 `provider/model`。如果
    省略供應商，OpenClaw 會先嘗試比對別名，接著比對該模型 ID 在已設定供應商中
    唯一符合的項目，最後退回已設定的預設供應商（已棄用的相容性路徑）。如果該
    供應商已不再提供已設定的預設模型，OpenClaw 會改用第一個已設定的
    供應商／模型，而非沿用過時的預設值。

  </Accordion>

  <Accordion title="你建議使用哪個模型？">
    使用供應商堆疊所提供最新世代中能力最強的模型，
    尤其是啟用工具或處理不受信任輸入的代理程式——較弱或
    過度量化的模型更容易受到提示詞注入影響並產生不安全
    行為（請參閱[安全性](/zh-TW/gateway/security)）。依代理程式角色將例行或低風險的
    聊天路由至較便宜的模型。

    依代理程式路由模型，並使用子代理程式平行處理耗時工作（每個
    子代理程式都會消耗自己的權杖）。請參閱[模型](/zh-TW/concepts/models)、
    [子代理程式](/zh-TW/tools/subagents)、[MiniMax](/zh-TW/providers/minimax)及
    [本機模型](/zh-TW/gateway/local-models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    只變更模型欄位——避免完整取代設定。

    - 在聊天中使用 `/model`（每個工作階段個別設定，請參閱[斜線命令](/zh-TW/tools/slash-commands)）
    - `openclaw models set ...`（僅更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 直接編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    若要透過 RPC 編輯，請先使用 `config.schema.lookup` 檢查（正規化
    路徑、淺層結構描述文件、子項目摘要），接著優先使用 `config.patch`，
    而非以部分物件搭配 `config.apply`。如果已覆寫設定，
    請從備份還原，或執行 `openclaw doctor` 進行修復。

    文件：[模型](/zh-TW/concepts/models)、[設定](/zh-TW/cli/configure)、
    [組態](/zh-TW/cli/config)、[診斷修復](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="可以使用自行託管的模型（llama.cpp、vLLM、Ollama）嗎？">
    可以——Ollama 是最簡單的方式。快速設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 若也要使用雲端模型，請執行 `ollama signin`
    4. 執行 `openclaw onboard`，選擇 `Ollama`，接著選擇 `Local` 或 `Cloud + Local`

    `Cloud + Local` 可同時提供雲端模型與本機 Ollama 模型；
    `kimi-k2.5:cloud` 等雲端模型不必在本機拉取。若要手動切換：
    先使用 `openclaw models list`，再使用 `openclaw models set ollama/<model>`。

    較小或高度量化的模型更容易受到提示詞注入影響。
    任何可存取工具的機器人都應使用大型模型；如果仍要使用小型模型，
    請啟用沙箱機制及嚴格的工具允許清單。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型供應商](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱機制](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="如何即時切換模型（不重新啟動）？">
    將 `/model <name>` 作為獨立訊息傳送。請參閱
    [斜線命令](/zh-TW/tools/slash-commands)以取得完整命令清單，
    包括編號選擇器（`/model`、`/model
    list`、`/model 3`）、用於清除工作階段覆寫值的 `/model default`，以及
    用於檢視端點／API 模式詳細資訊的 `/model status`。

    使用 `@profile` 強制每個工作階段採用指定的驗證設定檔：

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    若要取消固定透過 `@profile` 設定的設定檔，請重新執行不含
    後綴的 `/model`（例如 `/model anthropic/claude-opus-4-6`），或從
    `/model` 選擇預設項目。使用 `/model status` 確認目前使用中的驗證設定檔。

  </Accordion>

  <Accordion title="如果兩個供應商提供相同的模型 ID，/model 會使用哪一個？">
    `/model provider/model` 會選擇該確切的供應商路由。例如，
    即使模型 ID 相同，`qianfan/deepseek-v4-flash` 與 `deepseek/deepseek-v4-flash` 仍是不同的
    參照——OpenClaw 不會因為只比對到相同 ID 而悄悄切換
    供應商。

    使用者選取的 `/model` 參照會嚴格限制容錯移轉：如果該
    供應商／模型無法使用，回覆會明確失敗，而不會
    退回 `agents.defaults.model.fallbacks`。已設定的容錯移轉
    鏈仍適用於已設定的預設值、排程工作的主要模型，以及
    自動選取的容錯移轉狀態。當未使用工作階段覆寫值的執行
    可使用容錯移轉時，OpenClaw 會先嘗試要求的供應商／模型，再嘗試
    已設定的備援項目，最後嘗試已設定的主要模型——因此重複的裸
    模型 ID 絕不會直接跳回預設供應商。

    請參閱[模型](/zh-TW/concepts/models)及[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>

  <Accordion title="可以日常使用 GPT 5.5，並以 Codex 5.5 進行程式設計嗎？">
    可以——模型選擇與執行階段選擇彼此獨立：

    - **原生 Codex 程式設計代理程式：**將 `agents.defaults.model.primary` 設為
      `openai/gpt-5.5`。使用 `openclaw models auth login --provider
      openai` 登入，以採用 ChatGPT／Codex 訂閱驗證。
    - **代理程式迴圈以外的直接 OpenAI API 工作：**針對圖片、
      嵌入、語音、即時處理及其他非代理程式 OpenAI API 介面
      設定 `OPENAI_API_KEY`。
    - **OpenAI 代理程式 API 金鑰驗證：**使用 `/model openai/gpt-5.5`，並搭配已排序的
      `openai` API 金鑰設定檔。
    - **子代理程式：**將程式設計工作路由至以 Codex 為主的代理程式，並為其
      設定專屬的 `openai/gpt-5.5` 模型。

    請參閱[模型](/zh-TW/concepts/models)及[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何設定 GPT 5.5 的快速模式？">
    - **每個工作階段：**使用 `openai/gpt-5.5` 時傳送 `/fast on`。
    - **每個模型的預設值：**將
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 設為 `true`。
    - **自動截止：**`/fast auto` 或 `params.fastMode: "auto"` 會讓截止時間前的新
      模型呼叫採用快速模式，而截止時間後的重試、容錯移轉、
      工具結果或接續呼叫則不使用快速模式。截止時間預設為
      60 秒；可透過模型上的 `params.fastAutoOnSeconds` 覆寫。

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

    快速模式會對應至原生 OpenAI Responses 要求上的 `service_tier = "priority"`；
    既有的 `service_tier` 值會保留，且快速模式不會
    改寫 `reasoning` 或 `text.verbosity`。工作階段 `/fast` 覆寫值的優先順序高於
    設定預設值。

    請參閱[思考與快速模式](/zh-TW/tools/thinking)，以及
    [OpenAI](/zh-TW/providers/openai) 供應商頁面「進階設定」下的「快速模式」一節。

  </Accordion>

  <Accordion title='為什麼會看到「Model ... is not allowed」，之後卻沒有回覆？'>
    如果 `agents.defaults.modelPolicy.allow` 非空白，它就會成為
    `/model`、工作階段覆寫值及 `--model` 的**允許清單**。選擇清單以外的模型時，
    會傳回以下內容，而非一般回覆：

    ```text
    模型覆寫值 "provider/model" 不受 agents.defaults.modelPolicy.allow 允許。
    ```

    修正方式：將確切模型或 `"provider/*"` 等供應商萬用字元新增至
    指定的 `modelPolicy.allow` 清單、移除／清空該清單，或從
    `/model list` 選擇模型。如果命令也
    包含 `--runtime codex`，請先更新允許清單，再重試相同的
    `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='為什麼會看到「Unknown model: minimax/MiniMax-M3」？'>
    如果使用的是較舊的 OpenClaw 版本，請先升級（或透過原始碼執行
    `main`）並重新啟動閘道——已安裝版本的目錄中可能尚未包含
    `MiniMax-M3`。否則代表 MiniMax 供應商尚未設定
    （找不到供應商項目或驗證設定檔），因此無法解析該模型。
    如需完整修正檢查清單、供應商／模型 ID 表格及設定區塊範例，
    請參閱 [MiniMax](/zh-TW/providers/minimax) 供應商頁面的「疑難排解」一節。

  </Accordion>

  <Accordion title="可以將 MiniMax 設為預設模型，並使用 OpenAI 處理複雜工作嗎？">
    可以。將 MiniMax 設為預設值，並依工作階段切換模型——容錯移轉
    是用於處理錯誤，而非「困難工作」，因此請使用 `/model` 或不同的代理程式。

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

    接著使用 `/model gpt`。

    **選項 B：使用不同代理程式**——代理程式 A 預設使用 MiniMax，代理程式 B
    預設使用 OpenAI；依代理程式路由，或使用 `/agent` 切換。

    文件：[模型](/zh-TW/concepts/models)、[多代理程式路由](/zh-TW/concepts/multi-agent)、
    [MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus／sonnet／gpt 是內建捷徑嗎？">
    是——它們是內建縮寫，只有當目標模型存在於
    `agents.defaults.models` 時才會套用：

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

    自訂的同名別名會覆寫內建別名。

  </Accordion>

  <Accordion title="如何定義／覆寫模型捷徑（別名）？">
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

    之後，`/model sonnet`（或在支援時使用 `/<alias>`）就會解析為該
    模型 ID。

  </Accordion>

  <Accordion title="如何新增 OpenRouter 或 Z.AI 等其他供應商的模型？">
    OpenRouter（按權杖計費；提供多種模型）：

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

    如果參照的供應商／模型缺少供應商金鑰，執行階段會引發
    驗證錯誤（例如 `No API key found for provider "zai"`）。

    **新增代理程式後找不到 API 金鑰**

    新代理程式的驗證儲存區是空的——驗證資訊依代理程式分開儲存，位置如下：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方式：執行 `openclaw agents add <id>` 並在精靈中設定驗證，或
    僅從主要代理程式的儲存區複製可攜式靜態 `api_key`/`token` 設定檔。
    若使用 OAuth，請在新代理程式需要自己的帳號時，從該代理程式登入。
    如需完整的 `agentDir` 重複使用與認證資訊共用規則，請參閱
    [多代理程式路由](/zh-TW/concepts/multi-agent)——絕不可跨代理程式重複使用
    `agentDir`。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型皆失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    分為兩個階段：

    1. 同一供應商內的**驗證設定檔輪替**。
    2. **模型備援**至 `agents.defaults.model.fallbacks` 中的下一個模型。

    失敗的設定檔會進入冷卻期（指數退避），因此當供應商受到速率限制或暫時故障時，
    OpenClaw 仍能持續回應。

    速率限制範疇不只涵蓋一般的 `429`：`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`，以及週期性
    用量期間限制（`weekly/monthly limit reached`），全都會視為
    足以觸發容錯移轉的速率限制。

    計費回應不一定都是 `402`，而且部分 `402` 仍會歸入
    暫時性／速率限制類別，而非計費類別。`401`/`403` 上明確的
    計費文字仍可導向計費類別；供應商專用的文字比對器（例如 OpenRouter `Key limit exceeded`）
    仍僅限用於其所屬供應商。若 `402` 看起來像是可重試的用量期間限制或
    組織／工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），則會視為 `rate_limit`，而非
    長時間停用計費功能。

    上下文溢位錯誤完全不會進入備援路徑——例如
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、`input is
    too long for the model` 或 `ollama error: context length exceeded` 等特徵，
    會進入壓縮／重試，而不會推進模型備援。

    一般伺服器錯誤文字的判定範圍，比「任何包含 unknown/error 的內容」更窄。
    下列供應商限定的暫時性格式會視為容錯移轉訊號：Anthropic 的純
    `An unknown error occurred`、OpenRouter 的純
    `Provider returned error`、例如 `Unhandled stop reason:
    error` 的停止原因錯誤、含有暫時性伺服器文字
    （`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`）
    的 JSON `api_error` 承載資料，以及當供應商上下文相符時，
    例如 `ModelNotReadyException` 的供應商忙碌錯誤。像 `LLM request failed
    with an unknown error.`
    這類一般內部備援文字會採取保守判定，本身不會觸發備援。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」代表什麼？'>
    驗證設定檔 ID `anthropic:default` 在預期的驗證儲存區中沒有認證資訊。

    **修正檢查清單：**

    - 確認設定檔的存放位置——目前位置：
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`；舊版位置：
      `~/.openclaw/agent/*`（由 `openclaw doctor` 移轉）。
    - 確認閘道會載入你的環境變數。僅在你的 shell 中設定的 `ANTHROPIC_API_KEY`
      不會傳入透過 systemd/launchd 執行的閘道——請將它放入
      `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - 確認你編輯的是正確的代理程式——多代理程式設定會有
      多個 `auth-profiles.json` 檔案。
    - 執行 `openclaw models status`，查看已設定的模型與供應商
      驗證狀態。

    **若是「No credentials found for profile anthropic」（沒有電子郵件後綴）：**

    此次執行已固定使用閘道找不到的 Anthropic 設定檔。

    - 使用 Claude CLI：在閘道主機上執行 `openclaw models auth login --provider anthropic
      --method cli --set-default`。
    - 若偏好使用 API 金鑰：在閘道主機的
      `~/.openclaw/.env` 中加入 `ANTHROPIC_API_KEY`，接著清除任何會強制使用遺失設定檔的
      固定順序：

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - 遠端模式：驗證設定檔位於閘道機器上，而不是你的
      筆記型電腦——請確認你是在該機器上執行命令。

  </Accordion>

  <Accordion title="為什麼它也嘗試了 Google Gemini，然後失敗？">
    如果你的模型設定包含 Google Gemini 作為備援（或你已切換到 Gemini 簡寫），
    OpenClaw 會在備援期間嘗試使用它。未設定 Google
    認證資訊時會出現 `No API key found for provider
    "google"`。修正方式：新增 Google 驗證，或從
    `agents.defaults.model.fallbacks`/別名中移除 Google 模型。

    **LLM 要求遭拒：需要思考簽章（Google Antigravity）**

    原因：工作階段歷程包含沒有簽章的思考區塊（通常源自中止或不完整的串流）；
    Google Antigravity 要求思考區塊必須附有簽章。OpenClaw 會為 Google
    Antigravity Claude 移除未簽署的思考區塊；如果問題仍然出現，請開始新的工作階段，
    或為該代理程式設定 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：其用途與管理方式

相關內容：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、權杖儲存、多帳號模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    這是與供應商繫結的具名認證資訊記錄（OAuth 或 API 金鑰），儲存於：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    在不傾印祕密的情況下檢查已儲存的設定檔：`openclaw models auth
    list`（可選擇加上 `--provider <id>` 或 `--json`）。請參閱
    [模型命令列介面](/zh-TW/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="常見的設定檔 ID 有哪些？">
    以供應商為前綴：`anthropic:default`（沒有電子郵件身分時很常見）、
    OAuth 身分使用 `anthropic:<email>`，或使用你自行選擇的自訂 ID
    （例如 `anthropic:work`）。

  </Accordion>

  <Accordion title="我可以控制先嘗試哪個驗證設定檔嗎？">
    可以。`auth.order.<provider>` 設定可指定各供應商的輪替順序
    （僅含中繼資料——不儲存祕密）。

    OpenClaw 可能會略過處於短期**冷卻**狀態（速率限制、
    逾時、驗證失敗）或較長期**停用**狀態
    （計費／額度不足）的設定檔。請使用 `openclaw models status
    --json` 檢查，並查看 `auth.unusableProfiles`。
    速率限制冷卻期可限定於特定模型——某個設定檔即使對一個模型處於冷卻狀態，
    仍可服務同一供應商的同系列模型；計費／停用期間則會封鎖整個設定檔。

    設定各代理程式的順序覆寫（儲存在該代理程式的 `auth-state.json` 中）：

    ```bash
    # 預設使用已設定的預設代理程式（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 將輪替鎖定為單一設定檔
    openclaw models auth order set --provider anthropic anthropic:default

    # 或設定明確順序（同一供應商內備援）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆寫（退回設定 auth.order／循環輪替）
    openclaw models auth order clear --provider anthropic

    # 指定特定代理程式
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    驗證實際會嘗試的項目：`openclaw models status --probe`。若明確順序中省略了
    已儲存的設定檔，系統會回報
    `excluded_by_auth_order`，而不會默默嘗試該設定檔。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有何不同？">
    - **OAuth／命令列介面登入**通常會在供應商支援時使用訂閱存取權。
      對 Anthropic 而言，OpenClaw 的 Claude CLI 後端使用
      Claude Code `claude -p`，Anthropic 目前將其視為
      Agent SDK／程式化用法，會計入訂閱用量限制——請參閱
      [Anthropic](/zh-TW/providers/anthropic)，了解目前的計費暫停狀態與來源連結。
    - **API 金鑰**採用按權杖計費。

    精靈支援 Anthropic Claude CLI、OpenAI Codex OAuth 與 API 金鑰。

  </Accordion>
</AccordionGroup>

## 相關內容

- [常見問題](/zh-TW/help/faq)——主要常見問題
- [常見問題——快速入門與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
