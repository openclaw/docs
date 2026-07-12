---
read_when:
    - 選擇或切換模型、設定別名
    - 偵錯模型容錯移轉／「所有模型皆失敗」
    - 瞭解驗證設定檔及其管理方式
sidebarTitle: Models FAQ
summary: 常見問題：模型預設值、選擇、別名、切換、容錯移轉與驗證設定檔
title: 常見問題：模型與驗證
x-i18n:
    generated_at: "2026-07-11T21:24:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  模型與驗證設定檔的問答。關於設定、工作階段、閘道、頻道與疑難排解，請參閱主要的[常見問題](/zh-TW/help/faq)。

  ## 模型：預設值、選擇、別名與切換

  <AccordionGroup>
  <Accordion title='什麼是「預設模型」？'>
    使用以下設定：

    ```text
    agents.defaults.model.primary
    ```

    模型使用 `provider/model` 參照格式（例如：`openai/gpt-5.5`、
    `anthropic/claude-sonnet-4-6`）。請一律明確設定 `provider/model`。如果
    省略提供者，OpenClaw 會先嘗試比對別名，接著在已設定的提供者中尋找該模型 ID
    的唯一相符項目，最後才回退至已設定的預設提供者（已棄用的相容性路徑）。如果該
    提供者已不再擁有已設定的預設模型，OpenClaw 會改為回退至第一個已設定的
    提供者／模型，而不是使用過時的預設值。

  </Accordion>

  <Accordion title="你推薦哪個模型？">
    請使用提供者組合所提供的最新一代最強模型，尤其是具備工具功能或會處理不受信任輸入
    的代理程式——較弱或過度量化的模型更容易受到提示注入與不安全行為的影響
    （請參閱[安全性](/zh-TW/gateway/security)）。可依代理程式角色，將較便宜的模型用於
    例行或低風險對話。

    請依代理程式分配模型，並使用子代理程式平行處理耗時任務（每個子代理程式都會消耗
    自己的權杖）。請參閱[模型](/zh-TW/concepts/models)、
    [子代理程式](/zh-TW/tools/subagents)、[MiniMax](/zh-TW/providers/minimax)與
    [本機模型](/zh-TW/gateway/local-models)。

  </Accordion>

  <Accordion title="如何在不清除設定的情況下切換模型？">
    僅變更模型欄位——避免完整取代設定。

    - 在聊天中使用 `/model`（每個工作階段各自設定，請參閱[斜線命令](/zh-TW/tools/slash-commands)）
    - `openclaw models set ...`（僅更新模型設定）
    - `openclaw configure --section model`（互動式）
    - 直接編輯 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

    若透過 RPC 編輯，請先使用 `config.schema.lookup` 檢查（正規化路徑、淺層結構描述文件、
    子項摘要），接著應優先使用 `config.patch` 搭配部分物件，而非 `config.apply`。
    如果確實覆寫了設定，請從備份還原，或執行 `openclaw doctor` 進行修復。

    文件：[模型](/zh-TW/concepts/models)、[設定精靈](/zh-TW/cli/configure)、
    [設定](/zh-TW/cli/config)、[診斷工具](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="可以使用自行託管的模型（llama.cpp、vLLM、Ollama）嗎？">
    可以——Ollama 是最簡單的方式。快速設定：

    1. 從 `https://ollama.com/download` 安裝 Ollama
    2. 拉取本機模型，例如 `ollama pull gemma4`
    3. 若也要使用雲端模型，請執行 `ollama signin`
    4. 執行 `openclaw onboard`，選擇 `Ollama`，接著選擇 `Local` 或 `Cloud + Local`

    `Cloud + Local` 可同時提供雲端模型與本機 Ollama 模型；像
    `kimi-k2.5:cloud` 這類雲端模型不需要在本機拉取。若要手動切換：
    `openclaw models list`，接著執行 `openclaw models set ollama/<model>`。

    較小或高度量化的模型更容易受到提示注入攻擊。任何具有工具存取權的機器人都應使用
    大型模型；如果仍要使用小型模型，請啟用沙箱機制與嚴格的工具允許清單。

    文件：[Ollama](/zh-TW/providers/ollama)、[本機模型](/zh-TW/gateway/local-models)、
    [模型提供者](/zh-TW/concepts/model-providers)、[安全性](/zh-TW/gateway/security)、
    [沙箱機制](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="如何即時切換模型（無須重新啟動）？">
    將 `/model <name>` 作為獨立訊息傳送。完整命令清單請參閱
    [斜線命令](/zh-TW/tools/slash-commands)，其中包括編號選擇器（`/model`、`/model
    list`、`/model 3`）、用於清除工作階段覆寫的 `/model default`，以及用於查看
    端點／API 模式詳細資訊的 `/model status`。

    使用 `@profile` 可為每個工作階段強制指定特定驗證設定檔：

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    若要解除以 `@profile` 固定的設定檔，請在不加後綴的情況下重新執行 `/model`
    （例如 `/model anthropic/claude-opus-4-6`），或從 `/model` 中選擇預設項目。
    使用 `/model status` 確認目前使用中的驗證設定檔。

  </Accordion>

  <Accordion title="如果兩個提供者提供相同的模型 ID，/model 會使用哪一個？">
    `/model provider/model` 會選取該確切的提供者路由。例如，
    `qianfan/deepseek-v4-flash` 與 `deepseek/deepseek-v4-flash` 是不同的參照，
    即使模型 ID 相同也是如此——OpenClaw 不會因僅有 ID 相符而靜默切換提供者。

    使用者選取的 `/model` 參照採用嚴格的回退規則：如果該提供者／模型無法使用，
    回覆會明確失敗，而不會回退至 `agents.defaults.model.fallbacks`。已設定的回退鏈
    仍適用於已設定的預設值、排程工作的主要模型，以及自動選取的回退狀態。當未設定
    工作階段覆寫的執行允許使用回退時，OpenClaw 會先嘗試要求的提供者／模型，再嘗試
    已設定的回退項目，最後才嘗試已設定的主要模型——因此，重複的純模型 ID 絕不會
    直接跳回預設提供者。

    請參閱[模型](/zh-TW/concepts/models)與[模型容錯移轉](/zh-TW/concepts/model-failover)。

  </Accordion>

  <Accordion title="可以將 GPT 5.5 用於日常工作，並將 Codex 5.5 用於程式設計嗎？">
    可以——模型選擇與執行階段選擇彼此獨立：

    - **原生 Codex 程式設計代理程式：**將 `agents.defaults.model.primary` 設為
      `openai/gpt-5.5`。若要使用 ChatGPT／Codex 訂閱驗證，請透過
      `openclaw models auth login --provider openai` 登入。
    - **代理程式迴圈之外的直接 OpenAI API 任務：**設定
      `OPENAI_API_KEY`，以供圖片、嵌入、語音、即時互動及其他非代理程式的
      OpenAI API 介面使用。
    - **OpenAI 代理程式 API 金鑰驗證：**使用 `/model openai/gpt-5.5`，
      並搭配已排序的 `openai` API 金鑰設定檔。
    - **子代理程式：**將程式設計任務分配給專注於 Codex 的代理程式，並為其設定
      自己的 `openai/gpt-5.5` 模型。

    請參閱[模型](/zh-TW/concepts/models)與[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何設定 GPT 5.5 的快速模式？">
    - **每個工作階段：**使用 `openai/gpt-5.5` 時傳送 `/fast on`。
    - **每個模型的預設值：**將
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` 設為 `true`。
    - **自動截止：**`/fast auto` 或 `params.fastMode: "auto"` 會讓新的
      模型呼叫在截止時間前使用快速模式，之後的重試、回退、工具結果或接續呼叫則不使用
      快速模式。截止時間預設為 60 秒；可透過模型上的 `params.fastAutoOnSeconds`
      覆寫。

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

    在原生 OpenAI Responses 要求中，快速模式會對應至 `service_tier = "priority"`；
    現有的 `service_tier` 值會保留，而且快速模式不會改寫 `reasoning` 或
    `text.verbosity`。工作階段的 `/fast` 覆寫優先於設定預設值。

    請參閱[思考與快速模式](/zh-TW/tools/thinking)，以及 [OpenAI](/zh-TW/providers/openai)
    提供者頁面中「進階設定」下的「快速模式」章節。

  </Accordion>

  <Accordion title='為什麼會看到「Model ... is not allowed」，之後卻沒有回覆？'>
    如果已設定 `agents.defaults.models`，它就會成為 `/model` 與工作階段覆寫的
    **允許清單**。選取清單以外的模型時，將傳回以下內容，而非一般回覆：

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    修正方式：將確切模型加入 `agents.defaults.models`、針對動態目錄加入類似
    `"provider/*": {}` 的提供者萬用字元、移除允許清單，或從 `/model list`
    選擇模型。如果命令也包含 `--runtime codex`，請先更新允許清單，再重新執行相同的
    `/model provider/model --runtime codex` 命令。

  </Accordion>

  <Accordion title='為什麼會看到「Unknown model: minimax/MiniMax-M3」？'>
    如果使用較舊的 OpenClaw 版本，請先升級（或從原始碼的 `main` 執行）並重新啟動
    閘道——已安裝版本的目錄中可能尚未包含 `MiniMax-M3`。否則，表示 MiniMax
    提供者尚未設定（找不到提供者項目或驗證設定檔），因此無法解析該模型。完整的修正
    檢查清單、提供者／模型 ID 表格與設定區塊範例，請參閱
    [MiniMax](/zh-TW/providers/minimax) 提供者頁面的「疑難排解」章節。

  </Accordion>

  <Accordion title="可以使用 MiniMax 作為預設模型，並使用 OpenAI 處理複雜任務嗎？">
    可以。將 MiniMax 設為預設模型，並依工作階段切換模型——回退機制用於處理錯誤，
    而不是「困難任務」，因此請使用 `/model` 或另一個代理程式。

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

    **選項 B：使用不同的代理程式**——代理程式 A 預設使用 MiniMax，代理程式 B
    預設使用 OpenAI；可依代理程式進行路由，或使用 `/agent` 切換。

    文件：[模型](/zh-TW/concepts/models)、[多代理程式路由](/zh-TW/concepts/multi-agent)、
    [MiniMax](/zh-TW/providers/minimax)、[OpenAI](/zh-TW/providers/openai)。

  </Accordion>

  <Accordion title="opus／sonnet／gpt 是內建捷徑嗎？">
    是——它們是內建簡寫，僅在目標模型存在於 `agents.defaults.models` 時套用：

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

    你自行設定的同名別名會覆寫內建別名。

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

    之後，`/model sonnet`（或在支援時使用 `/<alias>`）會解析至該模型 ID。

  </Accordion>

  <Accordion title="如何新增 OpenRouter 或 Z.AI 等其他提供者的模型？">
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

    如果所參照的提供者／模型缺少提供者金鑰，執行階段會引發驗證錯誤
    （例如 `No API key found for provider "zai"`）。

    **新增代理程式後找不到提供者的 API 金鑰**

    新代理程式的驗證儲存區是空的——驗證資料依代理程式分開儲存，位置為：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方式：執行 `openclaw agents add <id>`，並在精靈中設定驗證，或
    僅從主要代理程式的儲存區複製可攜式靜態 `api_key`/`token` 設定檔。
    若使用 OAuth，請在新代理程式需要自己的帳戶時，從該代理程式登入。
    完整的 `agentDir` 重複使用與憑證共用規則，請參閱
    [多代理程式路由](/zh-TW/concepts/multi-agent)——絕不可跨代理程式重複使用
    `agentDir`。

  </Accordion>
</AccordionGroup>

## 模型容錯移轉與「所有模型均失敗」

<AccordionGroup>
  <Accordion title="容錯移轉如何運作？">
    分為兩個階段：

    1. 在同一供應商內進行**驗證設定檔輪替**。
    2. **模型備援**至 `agents.defaults.model.fallbacks` 中的下一個模型。

    發生失敗的設定檔會進入冷卻期（採用指數退避），因此當供應商受到速率限制或暫時發生故障時，
    OpenClaw 仍可繼續回應。

    速率限制類別不只涵蓋一般的 `429`：`Too many concurrent
    requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai
    ... quota limit exceeded`、`resource exhausted`，以及週期性的
    用量時段限制（`weekly/monthly limit reached`），都會視為應觸發
    容錯移轉的速率限制。

    計費回應不一定都是 `402`，有些 `402` 仍會歸入暫時性／速率限制類別，
    而非計費類別。`401`/`403` 中明確的計費文字仍可能歸入計費類別；
    供應商專屬的文字比對器（例如 OpenRouter 的 `Key limit exceeded`）
    仍僅適用於其所屬供應商。若 `402` 的內容看似可重試的用量時段限制，
    或組織／工作區支出限制（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`），則會視為 `rate_limit`，
    而不會長時間停用計費功能。

    上下文溢位錯誤完全不會進入備援流程——例如
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、`input is
    too long for the model` 或 `ollama error: context length exceeded`
    等特徵，會進入壓縮／重試流程，而不會推進至下一個備援模型。

    一般伺服器錯誤文字的判定範圍比「任何包含 unknown/error 的內容」
    更嚴格。會視為容錯移轉訊號的供應商特定暫時性形式包括：Anthropic
    單獨回傳的 `An unknown error occurred`、OpenRouter 單獨回傳的
    `Provider returned error`、如 `Unhandled stop reason:
    error` 的停止原因錯誤、含有暫時性伺服器文字（`internal
    server error`、`unknown error, 520`、`upstream error`、`backend error`）
    的 JSON `api_error` 承載內容，以及在供應商上下文相符時，像
    `ModelNotReadyException` 這類供應商忙碌錯誤。像 `LLM request failed
    with an unknown error.` 這類一般內部備援文字，仍會採取保守判定，
    不會單獨觸發備援。

  </Accordion>

  <Accordion title='「找不到設定檔 anthropic:default 的憑證」代表什麼？'>
    驗證設定檔 ID `anthropic:default` 在預期的驗證儲存區中沒有憑證。

    **修正檢查清單：**

    - 確認設定檔的儲存位置——目前位置：
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`；舊版位置：
      `~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。
    - 確認閘道會載入您的環境變數。僅在 Shell 中設定的
      `ANTHROPIC_API_KEY`，不會傳遞至透過 systemd/launchd 執行的閘道——
      請將其放入 `~/.openclaw/.env`，或啟用 `env.shellEnv`。
    - 確認您正在編輯正確的代理程式——多代理程式設定會有多個
      `auth-profiles.json` 檔案。
    - 執行 `openclaw models status`，查看已設定的模型與供應商驗證狀態。

    **若顯示「找不到設定檔 anthropic 的憑證」（沒有電子郵件後綴）：**

    此次執行已固定使用閘道找不到的 Anthropic 設定檔。

    - 使用 Claude 命令列介面：在閘道主機上執行 `openclaw models auth login --provider anthropic
      --method cli --set-default`。
    - 若偏好改用 API 金鑰：請在閘道主機上的 `~/.openclaw/.env`
      中加入 `ANTHROPIC_API_KEY`，然後清除任何強制使用遺失設定檔的固定順序：

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - 遠端模式：驗證設定檔位於閘道機器上，而非您的筆記型電腦——
      請確認您是在該機器上執行命令。

  </Accordion>

  <Accordion title="為什麼它也嘗試了 Google Gemini，然後失敗？">
    如果您的模型設定將 Google Gemini 納入備援（或您切換為 Gemini 簡寫），
    OpenClaw 會在備援期間嘗試使用它。若未設定 Google 憑證，會顯示
    `No API key found for provider "google"`。修正方式：加入 Google
    驗證，或從 `agents.defaults.model.fallbacks`／別名中移除 Google 模型。

    **LLM 請求遭拒：需要思考簽章（Google Antigravity）**

    原因：工作階段歷史記錄包含沒有簽章的思考區塊（通常來自中止或不完整的串流）；
    Google Antigravity 要求思考區塊必須具有簽章。OpenClaw 會為 Google
    Antigravity Claude 移除未簽章的思考區塊；若問題仍然出現，請開始新的
    工作階段，或為該代理程式設定 `/thinking off`。

  </Accordion>
</AccordionGroup>

## 驗證設定檔：用途與管理方式

相關內容：[/concepts/oauth](/zh-TW/concepts/oauth)（OAuth 流程、權杖儲存、多帳戶模式）

<AccordionGroup>
  <Accordion title="什麼是驗證設定檔？">
    與供應商繫結的具名憑證記錄（OAuth 或 API 金鑰），儲存於：

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    若要檢查已儲存的設定檔而不輸出機密資訊，請執行 `openclaw models auth
    list`（可選擇加上 `--provider <id>` 或 `--json`）。請參閱
    [模型命令列介面](/zh-TW/cli/models#auth-profiles)。

  </Accordion>

  <Accordion title="常見的設定檔 ID 有哪些？">
    以供應商為前綴：`anthropic:default`（沒有電子郵件身分時常見）、
    用於 OAuth 身分的 `anthropic:<email>`，或您自行選擇的自訂 ID
    （例如 `anthropic:work`）。

  </Accordion>

  <Accordion title="可以控制優先嘗試哪個驗證設定檔嗎？">
    可以。`auth.order.<provider>` 設定會指定每個供應商的輪替順序
    （僅儲存中繼資料，不儲存任何機密資訊）。

    OpenClaw 可能會略過處於短期**冷卻**狀態（速率限制、逾時、驗證失敗）
    或較長期**停用**狀態（計費／額度不足）的設定檔。請使用
    `openclaw models status --json` 檢查，並查看
    `auth.unusableProfiles`。可透過 `auth.cooldowns.billingBackoffHours*`
    進行調整。速率限制冷卻可以只套用於特定模型——某個設定檔針對一個模型
    處於冷卻狀態時，仍可服務同一供應商的其他同級模型；計費／停用期間則會
    封鎖整個設定檔。

    設定個別代理程式的順序覆寫（儲存於該代理程式的 `auth-state.json`）：

    ```bash
    # 預設使用已設定的預設代理程式（省略 --agent）
    openclaw models auth order get --provider anthropic

    # 將輪替鎖定至單一設定檔
    openclaw models auth order set --provider anthropic anthropic:default

    # 或設定明確順序（同一供應商內備援）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 清除覆寫（退回使用設定中的 auth.order／循環輪替）
    openclaw models auth order clear --provider anthropic

    # 指定特定代理程式
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    若要確認實際會嘗試的項目，請執行 `openclaw models status --probe`。
    若明確順序中省略了某個已儲存的設定檔，系統會回報
    `excluded_by_auth_order`，而不會默默嘗試該設定檔。

  </Accordion>

  <Accordion title="OAuth 與 API 金鑰有何不同？">
    - **OAuth／命令列介面登入**通常會在供應商支援時使用訂閱存取權。
      對 Anthropic 而言，OpenClaw 的 Claude 命令列介面後端使用
      Claude Code `claude -p`；Anthropic 目前將其視為 Agent SDK／
      程式化用法，並從訂閱用量限制中扣除——如需目前的暫停計費狀態及來源連結，
      請參閱 [Anthropic](/zh-TW/providers/anthropic)。
    - **API 金鑰**採用按權杖計費。

    精靈支援 Anthropic Claude 命令列介面、OpenAI Codex OAuth 與 API 金鑰。

  </Accordion>
</AccordionGroup>

## 相關內容

- [常見問題](/zh-TW/help/faq)——主要常見問題
- [常見問題——快速入門與首次執行設定](/zh-TW/help/faq-first-run)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
