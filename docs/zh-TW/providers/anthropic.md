---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想要瀏覽配對電腦上的 Claude 命令列介面或 Claude Desktop 工作階段
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-19T13:57:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 527129e8d43fbb73f476b3cce7bd4fa05f8450ea337bf36f7ce71219d6cb1a5e
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型家族。OpenClaw 支援兩種驗證方式：

- **API 金鑰** - 直接存取 Anthropic API，依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** - 重複使用同一主機上現有的 Claude Code 登入

## 用量與成本追蹤

OpenClaw 會偵測可用的 Anthropic 認證資訊，並選取對應的用量介面：

- Claude 訂閱／設定認證資訊會顯示配額週期，以及選用的額外用量預算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 會在 Control UI 的 **用量** 中顯示供應商回報的 30 天組織成本與 Messages API 用量，包括每日支出、權杖／快取總量、最常用模型及成本類別。
- 儲存在 Anthropic 供應商設定檔中的 `sk-ant-admin...` 認證資訊，會自動偵測為 Admin API 金鑰。

Admin API 成本記錄來自 Anthropic 的[用量與成本 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。這是供應商實際收取的費用，與 OpenClaw 根據工作階段推算的預估成本不同。

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式
（`claude -p`）執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件
將該模式描述為 Agent SDK／程式化用法。Anthropic 於 2026 年 6 月 15 日
發布的支援更新，已暫停先前公布的獨立 Agent SDK 計費變更：Claude
Agent SDK、`claude -p` 與第三方應用程式用量目前仍會計入已登入
訂閱的用量限制；Anthropic 修訂該方案期間，先前公布的每月 Agent SDK
額度並不可用。

互動式 Claude Code 仍會計入已登入 Claude 方案的用量限制。
API 金鑰驗證採直接隨用隨付計費，不依賴該方案。
對於長期運作的閘道主機、共用自動化及需要可預測正式環境
支出的情境，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能會變更此行為，而不需要發布
OpenClaw 新版本：

- [Claude Code 命令列介面參考資料](https://code.claude.com/docs/en/cli-usage)
- [搭配 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：** 標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得 API 金鑰">
        在 [Anthropic Console](https://console.anthropic.com/) 中建立 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # 選擇：Anthropic API 金鑰
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 設定範例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude 命令列介面">
    **最適合：** 不使用個別 API 金鑰，直接重複使用現有的 Claude 命令列介面登入。

    <Steps>
      <Step title="確認 Claude 命令列介面已安裝並登入">
        使用以下指令確認：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # 選擇：Claude 命令列介面
        ```

        OpenClaw 會偵測並重複使用現有的 Claude 命令列介面認證資訊。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude 命令列介面後端的設定與執行階段詳細資料，請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    重複使用 Claude 命令列介面時，OpenClaw 程序必須與 Claude 命令列介面
    登入在同一主機上執行。Docker 安裝可保留容器的家目錄，並在該處登入
    Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    [Podman](/zh-TW/install/podman) 等其他容器安裝不會在設定或執行階段掛載主機的
    `~/.claude`；請在這些環境中使用 Anthropic API 金鑰，或選擇
    由 OpenClaw 管理 OAuth 的供應商，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 取得設定權杖

    在任何已安裝 Claude Code 的電腦上執行 `claude setup-token`。它會輸出
    一個以 `sk-ant-oat01-` 開頭的長效權杖。

    在初始設定期間，於 macOS 應用程式中的 **Connect with an API key or token** 下選擇
    **Anthropic setup-token**，然後貼上權杖；也可以使用：

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### 設定範例

    建議使用標準 Anthropic 模型參照，並加上命令列介面執行階段覆寫：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    為了相容性，舊版 `claude-cli/claude-opus-4-7` 模型參照仍可使用，
    但新的設定應將供應商／模型選擇維持為
    `anthropic/*`，並將執行後端放在供應商／模型執行階段原則中。

    ### 計費與 `claude -p`

    OpenClaw 會透過 Claude Code 的非互動式 `claude -p` 路徑執行 Claude 命令列介面。
    Anthropic 目前將該路徑視為 Agent SDK／程式化用法：

    - Anthropic 於 2026 年 6 月 15 日發布的支援更新，已暫停先前公布的
      獨立 Agent SDK 額度方案。
    - 訂閱方案中的 Claude Agent SDK、`claude -p` 與第三方應用程式用量，
      目前仍會計入已登入訂閱的用量限制。
    - Anthropic 修訂該方案期間，先前公布的每月 Agent SDK 額度
      並不可用。
    - Console／API 金鑰登入採隨用隨付 API 計費，不會取得
      訂閱方案的 Agent SDK 額度。

    如需暫停公告，請參閱 Anthropic 的 [Agent SDK 方案
    文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)；
    如需了解 Claude Code 訂閱方案行為，請參閱
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    方案文章。

    Anthropic 可能會變更 Claude Code 的計費與速率限制行為，而不需要發布
    OpenClaw 新版本。當計費可預測性很重要時，請檢查 `claude auth status`、`/status` 與
    Anthropic 的連結文件。

    <Tip>
    對於共用的正式環境自動化，請使用 Anthropic API 金鑰，而非
    Claude 命令列介面。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 與 [Z.AI／GLM](/zh-TW/providers/zai)
    的訂閱型選項。
    </Tip>

  </Tab>
</Tabs>

## 跨電腦的 Claude 工作階段

內建的 Anthropic 外掛會在一般工作階段側邊欄中新增 **Claude Code** 群組。
資料列會在一般「聊天」窗格中開啟。它會探索閘道及已連線節點主機上
尚未封存的 Claude Code 工作階段：

- Claude 命令列介面工作階段來自有效的專案索引記錄，以及目前的 JSONL
  檔案；其受限的中繼資料前綴會識別 `~/.claude/projects/` 下非側鏈的 `sdk-cli`
  工作階段。
- 當 Claude Desktop 的中繼資料指向相同的 Claude Code 工作階段 ID 時，
  Claude Desktop 工作階段會使用 Desktop 標題、活動時間與封存狀態。
- 僅限命令列介面的工作階段沒有封存旗標，因此只要逐字記錄仍存在，
  它就會維持可見。

探索不需要額外的 OpenClaw 設定。Anthropic 外掛已內建且預設啟用；
當本機 `~/.claude/projects/` 目錄存在時，原生 macOS 節點會公告唯讀的
Claude 工作階段命令。這些命令首次出現時，請核准節點配對升級。

側邊欄會依工作階段所在的閘道或已配對節點主機分組，並在各電腦回應後，
立即顯示該主機最新的受限頁面。主機連線狀態變更、頁面重新取得焦點時，
以及頁面可見期間至多每 30 秒，它都會再次協調，因此在 OpenClaw 外部
建立的 Claude 工作階段不必重新載入即可出現。目錄變更後會更快執行後續處理。
使用目錄群組下方的 **載入更多工作階段**，即可為所有尚有更多歷史記錄的主機
附加下一頁；附加的資料列會保持可見，並在重新整理時重新擷取至相同深度。
目錄用戶端使用 `sessions.catalog.list`；開啟資料列則使用
`sessions.catalog.read`。

終端接管會先從所屬主機使用者的登入 Shell PATH 解析 `claude`，
再使用服務／常駐程序的 PATH。這可讓應用程式啟動的工作階段，與操作者在
一般終端中使用的 Claude 命令列介面保持一致。

選取資料列時，會先讀取最新的逐字記錄頁面。**載入較舊的逐字記錄項目**
會依循不透明的位元組游標，從 JSONL 檔案讀取另一個受限區段，而不是載入
完整歷史記錄。一般使用者、助理、推理、工具呼叫及工具結果內容都會保留。
如果個別項目超過節點／閘道的安全上限，會清楚標示為已截斷。

對於閘道本機的 `claude-cli` 資料列，在一般撰寫區中輸入內容會呼叫
`sessions.catalog.continue`。OpenClaw 會重新解析本機目錄記錄、
建立或重複使用鎖定模型的原生工作階段、匯入最多 200 個可見項目或 512 KiB，
並植入 Claude 命令列介面繫結。第一輪會使用 `--fork-session` 繼續；
Claude 會為分支指派新的工作階段 ID，因此後續回合會使用該分支，而來源工作階段
保持不變。

無介面的節點主機也可以啟用下方的節點本機設定並重新啟動節點主機，
讓其 Claude 命令列介面資料列可以繼續：

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

只有在設定已啟用，且本機 `claude` 可執行檔可解析時，
節點才會公告 `agent.cli.claude.run.v1`。OpenClaw 會在該節點上重新解析目錄記錄、
匯入相同的受限歷史記錄，並將接管的工作階段繫結至該節點及目錄回報的工作目錄。
每個回合都會使用該節點的 Claude 檔案與登入，執行節點上真正的
`claude -p` 程序。節點的執行核准原則仍然適用；閘道無法強制啟用此選項。

節點續接 v1 僅能單次執行。它會省略閘道回送 MCP 設定與閘道 Skills 外掛引數，
不會從閘道逐字記錄重新植入內容，且會拒絕附件與圖片。Claude Desktop 資料列
仍然只能檢視。原生 macOS 應用程式節點在應用程式公告執行命令之前，也仍然只能檢視。

<Note>
除非無介面的節點明確公告 `agent.cli.claude.run.v1`，否則已配對節點上的 Claude
工作階段仍為唯讀。OpenClaw 絕不會修改 Claude Desktop 中繼資料或封存 Claude
工作階段。此頁面需要具備寫入範圍的操作者連線，因為它會使用已驗證的
`node.invoke`；即使在已啟用續接的節點上，列出與讀取仍為唯讀。
</Note>

請參閱[節點：Claude 工作階段與逐字記錄](/zh-TW/nodes#claude-sessions-and-transcripts)，
以瞭解節點命令與安全邊界。

## 思考預設值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 與 4.6）

`anthropic/claude-sonnet-5` 預設使用 `high` 強度的自適應思考。
使用 `/think off` 可停用思考，或使用 `/think xhigh|max` 啟用模型原生的
較高強度等級。由於 Anthropic 不支援在此模型上使用這些請求功能，
OpenClaw 對 Sonnet 5 會略過手動思考預算、自訂取樣參數、
助理預填內容與 Priority Tier。
目錄採用 Anthropic 的入門 `$2/$10` 輸入／輸出定價，至
2026 年 8 月 31 日為止；標準 `$3/$15` 定價將於 2026 年 9 月 1 日開始。

`anthropic/claude-fable-5` 一律使用自適應思考，且預設為 `high`
強度。Anthropic 不允許停用此模型的思考，因此
`/think off` 與 `/think minimal` 會改為對應至 `low` 強度。由於 Anthropic 會拒絕
任何已啟用思考之請求中的溫度覆寫，OpenClaw 也會略過 Fable 5 請求的
自訂溫度值。

`anthropic/claude-mythos-5` 是具有相同永久啟用
自適應思考合約的受限存取模型。OpenClaw 預設為 `high`，將 `/think off` 與
`/think minimal` 對應至 `low`，並略過呼叫端選取的取樣參數。
目錄會列出其 1,000,000 個權杖的內容窗口、128,000 個權杖的輸出
限制、影像輸入，以及 `$10/$50` 輸入／輸出定價。

Claude Opus 4.8 在 OpenClaw 中預設會關閉思考。當你明確
使用 `/think high|xhigh|max` 啟用自適應思考時，OpenClaw 會傳送
Anthropic 的 Opus 4.8 強度值；Claude 4.6 模型（Opus 4.6 與 Sonnet 4.6）
預設為 `adaptive`。

使用 `/think:<level>` 針對個別訊息覆寫，或在模型參數中設定：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
相關 Anthropic 文件：
- [自適應思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [延伸思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全拒絕備援（Claude Fable 5）

<Warning>
使用 Claude Fable 5 也代表會使用 Claude Opus 4.8。Fable 5 隨附
可拒絕請求的安全分類器，而 Anthropic 核准的
復原方式是讓 `claude-opus-4-8` 處理該輪請求。OpenClaw 會針對直接使用 API 金鑰的請求
自動選用此方式，因此部分 Fable 輪次會由 Claude Opus 4.8 回答，
並依 Claude Opus 4.8 計費。如果你的政策或預算無法接受
由 Opus 處理的輪次，請勿選取 `anthropic/claude-fable-5`。
</Warning>

### 此功能存在的原因

Fable 5 分類器會對受限領域中的請求傳回 `stop_reason: "refusal"`，
也會將接近良性內容的工作誤判為陽性（安全性
工具、生命科學，甚至是要求模型重現其原始
推理）。若沒有備援，即使其他 Claude 模型願意處理，該輪次仍會因錯誤而終止——Anthropic 自己的拒絕訊息
會要求 API 整合者設定備援模型。

### 運作方式

1. 對 `anthropic/claude-fable-5` 的每個直接 API 金鑰請求，OpenClaw
   都會傳送 Anthropic 的伺服器端備援選用設定：
   `server-side-fallback-2026-06-01` Beta 標頭加上
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 唯一允許用於 Fable 5 的
   備援目標。
2. 只有安全分類器拒絕才會觸發備援。速率限制、
   過載與伺服器錯誤的行為與先前完全相同，並會經由
   OpenClaw 的一般[模型容錯移轉](/zh-TW/concepts/model-failover)處理。
3. 救援會在同一次呼叫內進行。輸出任何內容前發生的拒絕，
   除了延遲外並不可見；整個答案都來自 Opus 4.8。若在串流途中遭拒，
   部分文字會保留為備援模型接續生成的前綴，而遭拒模型的推理與工具呼叫
   則會依 Anthropic 的重播規則捨棄（不得將其回傳或
   執行）。
4. 如果 Claude Opus 4.8 也拒絕，該輪次會將拒絕呈現為
   錯誤，與此功能推出前完全相同。

備援是在 Anthropic API 層級進行，因此 `claude-opus-4-8` 不
需要出現在你設定的模型清單或備援鏈中——支援 Fable 的
API 金鑰一律能夠使用 Opus。

### 可觀測性與計費

- 由備援處理的輪次會在助理訊息上記錄 `provider_fallback` 診斷資訊，
  其中會指明 `fromModel` 與 `toModel`，而訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 會按每次嘗試計費：輸出前的拒絕不收費，而救援
  會依 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的
  每輪成本估算會使用 Opus 費率計算由備援處理的輪次，以保持一致。
- 若在串流途中遭拒，Anthropic 端還會對已串流的 Fable 部分
  收費；該部分會回報在 API 的每次嘗試
  用量中，但不會納入 OpenClaw 的每輪估算。

### 適用範圍

適用於以 API 金鑰向
`api.anthropic.com` 驗證的 `anthropic/claude-fable-5`。OAuth（重複使用 Claude 命令列介面訂閱）、Proxy 基底 URL、
Bedrock、Vertex 與 Foundry 請求維持不變，仍會在這些環境中
將拒絕呈現為錯誤。

即時驗證：若不使用
備援，向 Fable 5 提交要求其重現原始思維鏈的良性提示時，會以 `category: "reasoning_extraction"` 拒絕；而透過 OpenClaw 提交相同提示時，
則會傳回由 Opus 處理的一般答案，並附加 `provider_fallback` 診斷資訊。

如需瞭解底層行為，請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示快取

OpenClaw 支援 Anthropic 的 API 金鑰驗證提示快取功能。

| 值               | 快取持續時間 | 說明                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（預設） | 5 分鐘      | 自動套用於 API 金鑰驗證 |
| `"long"`            | 1 小時         | 延長快取                         |
| `"none"`            | 不快取     | 停用提示快取                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="個別代理程式快取覆寫">
    使用模型層級參數作為基準，然後透過 `agents.list[].params` 覆寫特定代理程式：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    設定合併順序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（比對 `id`，依鍵覆寫）

    這讓一個代理程式能保留長期快取，而使用相同模型的另一個代理程式則可針對突發性／低重複使用率的流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後可接受 `cacheRetention` 直通傳遞。
    - 非 Anthropic 的 Bedrock 模型在執行階段會被強制設為 `cacheRetention: "none"`。
    - 未設定明確值時，API 金鑰智慧型預設值也會為 Claude-on-Bedrock 參照填入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換選項會針對使用 API 金鑰的直接流量，將 Anthropic 的 `service_tier` 欄位設為 `api.anthropic.com`。

    | 命令 | 對應至 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 僅適用於使用 API 金鑰提出的直接 `api.anthropic.com` 要求。OAuth／訂閱權杖要求與代理路由一律不會取得 `service_tier` 欄位。
    - 同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳戶上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建的 Anthropic 外掛會註冊圖片與 PDF 理解功能。OpenClaw
    會根據已設定的 Anthropic 驗證方式自動解析媒體功能；不需要
    額外設定。

    | 屬性            | 值                    |
    | --------------- | --------------------- |
    | 預設模型        | `claude-opus-4-8`     |
    | 支援的輸入      | 圖片、PDF 文件        |

    將圖片或 PDF 附加至對話時，OpenClaw 會自動
    透過 Anthropic 媒體理解提供者路由該附件。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Claude Sonnet 5、Mythos 5 與 Fable 5 具有恰好 1,000,000 個權杖的輸入
    視窗，並支援最多 128,000 個輸出權杖。Anthropic 的 1M 上下文
    視窗也已在具備自適應思考功能的 Claude 4.x 模型上正式推出：Opus 4.8、
    Opus 4.7、Opus 4.6 與 Sonnet 4.6。OpenClaw 會自動調整這些模型的
    大小，不需要 `params.context1m`：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    較舊的設定可以保留 `params.context1m: true`；對這些模型而言，它是不會造成影響的空操作，
    而且無論如何，OpenClaw 都不再傳送已淘汰的
    `context-1m-2025-08-07` 測試版標頭。在解析要求標頭時，會捨棄值為該設定的
    舊版 `anthropicBeta` 設定項目，而不支援的舊版 Claude 模型
    會維持其一般上下文視窗。

    `params.context1m: true` 對 Claude 命令列介面後端
    （`claude-cli/*`）的行為相同：符合資格且支援正式推出版本的 Opus 與 Sonnet 模型已會自動取得
    1M 視窗，因此該參數在此也屬選用。

    <Warning>
    你的 Anthropic 認證資訊必須具備長上下文存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic 測試版標頭，但如果已淘汰的 1M 測試版標頭仍存在於舊版設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 的 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗；不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然失效">
    Anthropic 權杖驗證會過期，也可能遭到撤銷。新的設定請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**依代理程式分開設定**；新的代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行引導設定（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的認證資訊'>
    執行 `openclaw models status` 以查看目前使用中的驗證設定檔。重新執行引導設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部皆在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 的速率限制冷卻可能僅適用於特定模型，因此同系列的其他 Anthropic 模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端的設定與執行階段詳細資訊。
  </Card>
  <Card title="提示詞快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示詞快取如何跨供應商運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
