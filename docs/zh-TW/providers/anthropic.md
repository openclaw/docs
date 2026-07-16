---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想要跨配對的電腦瀏覽 Claude 命令列介面或 Claude Desktop 工作階段
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T11:57:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建置 **Claude** 模型系列。OpenClaw 支援兩種驗證途徑：

- **API 金鑰** - 直接存取 Anthropic API，依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** - 重複使用同一主機上現有的 Claude Code 登入

## 用量與成本追蹤

OpenClaw 會偵測可用的 Anthropic 認證資訊，並選取相符的用量介面：

- Claude 訂閱／設定認證資訊會顯示配額週期與選用的額外用量預算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 會在控制介面的 **用量** 中顯示供應商回報的 30 天組織成本與 Messages API 用量，包括每日支出、權杖／快取總量、最常用模型及成本類別。
- 儲存在 Anthropic 供應商設定檔中的 `sk-ant-admin...` 認證資訊，會自動偵測為 Admin API 金鑰。

Admin API 成本記錄來自 Anthropic 的[用量與成本 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。這是供應商的實際帳單，與 OpenClaw 根據工作階段推算的預估成本分開計算。

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式
（`claude -p`）執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件
將該模式描述為 Agent SDK／程式化用法。Anthropic 於 2026 年 6 月 15 日
發布的支援更新暫停了先前宣布的獨立 Agent SDK 計費變更：Claude
Agent SDK、`claude -p` 與第三方應用程式用量仍會計入已登入
訂閱方案的用量限制，而 Anthropic 修訂該方案期間，先前宣布的每月 Agent SDK
抵用額度將不提供。

互動式 Claude Code 仍會計入已登入 Claude 方案的用量限制。
API 金鑰驗證採直接隨用隨付計費，不依賴該方案。
對於長期運作的閘道主機、共用自動化及需要可預測正式環境
支出的情境，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能會在 OpenClaw 未發布新版本的情況下
變更此行為：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取及依用量計費。

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
    **最適合：**不使用個別 API 金鑰，重複使用現有的 Claude 命令列介面登入。

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
    Claude 命令列介面後端的設定與執行階段詳細資訊請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    重複使用 Claude 命令列介面時，OpenClaw 程序必須與
    Claude 命令列介面登入在同一台主機上執行。Docker 安裝可以保存容器主目錄，並在其中登入
    Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    [Podman](/zh-TW/install/podman) 等其他容器安裝不會在設定或執行階段掛載主機的
    `~/.claude`；請在其中使用 Anthropic API 金鑰，或選擇
    由 OpenClaw 管理 OAuth 的供應商，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 取得設定權杖

    在任何已安裝 Claude Code 的機器上執行 `claude setup-token`。它會列印
    一個以 `sk-ant-oat01-` 開頭的長效權杖。

    初始設定期間，在 macOS 應用程式中選擇
    **Connect with an API key or token** 下的 **Anthropic setup-token**，然後貼上權杖；或使用：

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
    但新設定應將供應商／模型選擇維持為
    `anthropic/*`，並將執行後端放在供應商／模型執行階段政策中。

    ### 計費與 `claude -p`

    OpenClaw 使用 Claude Code 的非互動式 `claude -p` 路徑執行 Claude 命令列介面。
    Anthropic 目前將該路徑視為 Agent SDK／程式化用法：

    - Anthropic 於 2026 年 6 月 15 日發布的支援更新，暫停了先前宣布的
      獨立 Agent SDK 抵用額度方案。
    - 訂閱方案中的 Claude Agent SDK、`claude -p` 與第三方應用程式用量
      仍會計入已登入訂閱方案的用量限制。
    - Anthropic 修訂該方案期間，先前宣布的每月 Agent SDK 抵用額度
      將不提供。
    - Console／API 金鑰登入採隨用隨付 API 計費，且不會獲得
      訂閱方案的 Agent SDK 抵用額度。

    如需暫停通知，請參閱 Anthropic 的 [Agent SDK 方案
    文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)；
    如需了解訂閱方案行為，請參閱 Claude Code 的
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    方案文章。

    Anthropic 可以在 OpenClaw 未發布新版本的情況下變更 Claude Code 的計費及速率限制行為。
    當計費可預測性很重要時，請查看 `claude auth status`、`/status` 及
    Anthropic 的連結文件。

    <Tip>
    共用正式環境自動化應使用 Anthropic API 金鑰，而非
    Claude 命令列介面。OpenClaw 也支援下列供應商提供的訂閱型選項：
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 及 [Z.AI / GLM](/zh-TW/providers/zai)。
    </Tip>

  </Tab>
</Tabs>

## 跨電腦的 Claude 工作階段

隨附的 Anthropic 外掛會在一般工作階段側邊欄中新增 **Claude Code** 群組。
各列會在一般聊天窗格中開啟。它會探索閘道及已連線節點主機上未封存的 Claude
Code 工作階段：

- Claude 命令列介面工作階段來自有效的專案索引記錄，以及目前 JSONL
  檔案；這些檔案的有限範圍中繼資料前綴會識別 `~/.claude/projects/` 下非支線的
  `sdk-cli` 工作階段。
- 當 Claude Desktop 的中繼資料指向同一個 Claude Code 工作階段 ID 時，
  Claude Desktop 工作階段會使用 Desktop 標題、活動時間及
  封存狀態。
- 僅限命令列介面的工作階段沒有封存旗標，因此只要其
  逐字記錄仍存在，就會保持可見。

探索功能不需要額外的 OpenClaw 設定。Anthropic 外掛已隨附且預設啟用；
當本機 `~/.claude/projects/` 目錄存在時，原生 macOS 節點會公布唯讀的
Claude 工作階段命令。這些命令首次出現時，請核准節點配對升級。

側邊欄會依閘道或已配對節點主機將各列分組，先顯示每台主機最新的有限範圍頁面，
並依一般的 30 秒週期重新整理。使用目錄群組下方的 **載入更多工作階段**，
為每台仍有更多記錄的主機附加下一頁；附加的列會保持可見，
且重新整理時會重新擷取至相同深度。目錄用戶端使用
`sessions.catalog.list`；開啟一列則使用 `sessions.catalog.read`。

終端接管會先從所屬主機使用者的登入 Shell PATH 解析 `claude`，
再使用服務／常駐程式 PATH。如此可讓應用程式啟動的工作階段，與操作人員在一般終端中
使用的 Claude 命令列介面保持一致。

選取一列時會先讀取最新的逐字記錄頁面。**載入較舊的逐字記錄項目**
會依循不透明的位元組游標，從 JSONL 檔案讀取另一個有限範圍區段，
而不是載入完整記錄。一般的使用者、助理、推理、工具呼叫及工具結果內容
都會保留。若個別項目超過節點／閘道的安全上限，會清楚標示為已截斷。

對於閘道本機的 `claude-cli` 列，在一般撰寫區輸入內容會呼叫
`sessions.catalog.continue`。OpenClaw 會重新解析本機目錄記錄、
建立或重複使用模型鎖定的原生工作階段、匯入最多 200 個可見
項目或 512 KiB，並植入 Claude 命令列介面繫結。第一輪會使用
`--fork-session` 恢復；Claude 會為分支指派新的工作階段 ID，因此後續輪次會使用
該分支，來源工作階段則保持不變。

無介面的節點主機也可以啟用下列節點本機設定並重新啟動節點主機，
讓其 Claude 命令列介面列可繼續執行：

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

只有啟用此設定且其本機 `claude` 可執行檔可解析時，
節點才會公布 `agent.cli.claude.run.v1`。OpenClaw 會在該節點上重新解析目錄
記錄、匯入相同的有限範圍記錄，並將接管的工作階段繫結至該節點及目錄回報的
工作目錄。每一輪都會使用該節點的 Claude 檔案及登入資訊，執行節點上實際的
`claude -p` 程序。節點的執行核准政策仍然適用；閘道無法強制啟用此選項。

節點接續 v1 僅支援一次性執行。它會省略閘道回送 MCP 設定及
閘道 Skills 外掛引數、不會從閘道逐字記錄重新植入，且會拒絕附件與圖片。
Claude Desktop 列仍為僅供檢視。原生 macOS 應用程式節點也會維持僅供檢視，
直到應用程式公布執行命令為止。

<Note>
除非無介面節點明確公布 `agent.cli.claude.run.v1`，否則已配對節點的 Claude 工作階段
仍為唯讀。OpenClaw 絕不會修改 Claude Desktop
中繼資料或封存 Claude 工作階段。此頁面需要具備寫入範圍的操作人員連線，
因為它使用已驗證的 `node.invoke`；即使在已啟用接續功能的節點上，
列出與讀取操作仍維持唯讀。
</Note>

如需節點命令及安全界線，請參閱[節點：Claude 工作階段與逐字記錄](/zh-TW/nodes#claude-sessions-and-transcripts)。

## 思考預設值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 與 4.6）

`anthropic/claude-sonnet-5` 預設會以 `high` 力度使用自適應思考。
使用 `/think off` 可停用思考，或使用 `/think xhigh|max` 以採用模型原生的
更高力度等級。由於 Anthropic 不支援在此模型的請求中使用這些功能，OpenClaw 會省略手動思考預算、自訂
取樣參數、助理預填內容，以及 Sonnet 5 的 Priority Tier。
目錄採用 Anthropic 的推廣期 `$2/$10` 輸入／輸出定價，直到
2026 年 8 月 31 日為止；標準 `$3/$15` 定價將於 2026 年 9 月 1 日起生效。

`anthropic/claude-fable-5` 一律使用自適應思考，且預設為 `high`
力度。Anthropic 不允許停用此模型的思考，因此
`/think off` 和 `/think minimal` 會改為對應至 `low` 力度。由於 Anthropic 會拒絕
任何已啟用思考之請求中的溫度覆寫，OpenClaw 也會省略 Fable 5 請求的
自訂溫度值。

`anthropic/claude-mythos-5` 是有限存取模型，採用相同的一律啟用
自適應思考約定。OpenClaw 預設使用 `high`，將 `/think off` 和
`/think minimal` 對應至 `low`，並省略呼叫端選取的取樣參數。
目錄公布其 1,000,000 個 token 的上下文視窗、128,000 個 token 的輸出
上限、圖片輸入，以及 `$10/$50` 輸入／輸出定價。

Claude Opus 4.8 在 OpenClaw 中預設關閉思考。當你透過 `/think high|xhigh|max` 明確
啟用自適應思考時，OpenClaw 會傳送
Anthropic 的 Opus 4.8 力度值；Claude 4.6 模型（Opus 4.6 和 Sonnet 4.6）
預設為 `adaptive`。

使用 `/think:<level>` 覆寫單則訊息，或在模型參數中覆寫：

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

## 安全性拒絕備援（Claude Fable 5）

<Warning>
使用 Claude Fable 5 也代表會使用 Claude Opus 4.8。Fable 5 隨附
可能拒絕請求的安全性分類器，而 Anthropic 核准的
復原方式是由 `claude-opus-4-8` 處理該輪對話。OpenClaw 會針對直接使用 API 金鑰的請求
自動選擇加入此機制，因此部分 Fable 對話輪次會由 Claude Opus 4.8 回答
並依其計費。如果你的政策或預算無法接受
由 Opus 處理的對話輪次，請勿選取 `anthropic/claude-fable-5`。
</Warning>

### 此機制存在的原因

Fable 5 分類器會對受限制領域中的請求傳回 `stop_reason: "refusal"`，
也會對鄰近的無害工作產生誤判（安全性
工具、生命科學，甚至要求模型重現其原始
推理）。若無備援，即使其他 Claude 模型願意處理，該輪對話仍會因錯誤而終止——Anthropic 自己的拒絕訊息
會指示 API 整合者設定備援模型。

### 運作方式

1. 針對每個直接使用 API 金鑰向 `anthropic/claude-fable-5` 發出的請求，OpenClaw
   都會傳送 Anthropic 的伺服器端備援選擇加入設定：
   `server-side-fallback-2026-06-01` beta 標頭加上
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 唯一允許用於 Fable 5 的
   備援目標。
2. 只有安全性分類器拒絕才會觸發備援。速率限制、
   過載和伺服器錯誤的行為與以往完全相同，並會經由
   OpenClaw 的一般[模型容錯移轉](/zh-TW/concepts/model-failover)處理。
3. 救援會在同一次呼叫中進行。在尚未產生任何輸出前遭拒時，
   除了延遲之外不會留下可見跡象；整個回答都會來自 Opus 4.8。若在
   串流途中遭拒，部分文字會保留為備援
   模型接續生成的前綴，而遭拒模型的推理與工具呼叫
   則會依 Anthropic 的重播規則捨棄（不得將其回傳或
   執行）。
4. 如果 Claude Opus 4.8 也拒絕，該輪對話會將拒絕呈現為
   錯誤，與此功能推出前完全相同。

備援發生於 Anthropic API 層級，因此 `claude-opus-4-8` 不
需要列在你設定的模型清單或備援鏈中——可使用 Fable 的
API 金鑰一律能夠處理 Opus。

### 可觀測性與計費

- 由備援處理的對話輪次會在助理訊息中記錄 `provider_fallback` 診斷資訊，
  其中標示 `fromModel` 和 `toModel`，且該訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 會依每次嘗試計費：在輸出前遭拒不收費，而救援
  會依 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的
  每輪成本估算會以 Opus 費率計算由備援處理的對話輪次，以保持一致。
- 若在串流途中遭拒，Anthropic 端還會額外對已串流的 Fable 部分
  計費；該部分會回報於 API 的每次嘗試
  用量中，但不會納入 OpenClaw 的每輪估算。

### 適用範圍

適用於以 API 金鑰向
`api.anthropic.com` 驗證的 `anthropic/claude-fable-5`。OAuth（重複使用 Claude 命令列介面訂閱）、代理基底 URL、
Bedrock、Vertex 和 Foundry 請求維持不變，仍會在這些環境中將
拒絕呈現為錯誤。

即時驗證：直接傳送時，一則要求 Fable 5 重現其原始思維鏈的
無害提示會在未使用備援的情況下遭到拒絕，並顯示 `category: "reasoning_extraction"`；
同一提示透過 OpenClaw 傳送時，則會傳回由 Opus 處理的正常
回答，並附上 `provider_fallback` 診斷資訊。

如需了解底層行為，請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示快取

OpenClaw 支援 Anthropic 適用於 API 金鑰驗證的提示快取功能。

| 值               | 快取時間 | 說明                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（預設） | 5 分鐘      | API 金鑰驗證會自動套用 |
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
  <Accordion title="個別代理程式的快取覆寫">
    使用模型層級參數作為基準，再透過 `agents.list[].params` 覆寫特定代理程式：

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
    2. `agents.list[].params`（符合 `id`，依鍵覆寫）

    這讓一個代理程式可以保留長期快取，而同一模型上的另一個代理程式則可針對突發性／低重複使用的流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型在執行階段會被強制設為 `cacheRetention: "none"`。
    - 未設定明確值時，API 金鑰智慧預設值也會為 Bedrock 上的 Claude 參照植入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換會針對使用 API 金鑰的直接流量，將 Anthropic 的 `service_tier` 欄位設為 `api.anthropic.com`。

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
    - 僅適用於使用 API 金鑰提出的直接 `api.anthropic.com` 請求。OAuth／訂閱權杖請求和代理路由絕不會取得 `service_tier` 欄位。
    - 同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳號上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    隨附的 Anthropic 外掛會註冊圖片與 PDF 理解功能。OpenClaw
    會根據已設定的 Anthropic 驗證自動解析媒體功能；
    不需要額外設定。

    | 屬性            | 值                    |
    | --------------- | --------------------- |
    | 預設模型        | `claude-opus-4-8`     |
    | 支援的輸入      | 圖片、PDF 文件        |

    當圖片或 PDF 附加至對話時，OpenClaw 會自動
    將其路由至 Anthropic 媒體理解提供者。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Claude Sonnet 5、Mythos 5 和 Fable 5 具有精確的 1,000,000 權杖輸入
    視窗，並支援最多 128,000 個輸出權杖。Anthropic 的 1M 上下文
    視窗也已在具備自適應思考的 Claude 4.x 模型上正式推出：Opus 4.8、
    Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動調整這些模型的
    容量，不需要 `params.context1m`：

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

    較舊的設定可以保留 `params.context1m: true`；對這些模型而言，它是無害且不執行任何操作的設定，
    而且無論如何，OpenClaw 都不再傳送已淘汰的
    `context-1m-2025-08-07` Beta 標頭。請求標頭解析期間，會捨棄值為該內容的較舊 `anthropicBeta` 設定
    項目，而不支援的舊版 Claude 模型仍會使用其一般上下文視窗。

    對 Claude 命令列介面後端（`claude-cli/*`）而言，
    `params.context1m: true` 的行為也相同：符合資格且具備正式版功能的 Opus 和 Sonnet 模型已會自動取得
    1M 視窗，因此該參數在此也是選用的。

    <Warning>
    你的 Anthropic 認證資訊必須具備長上下文存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic Beta 標頭，但如果較舊設定中仍有已淘汰的 1M Beta 標頭，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗；不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然失效">
    Anthropic 權杖驗證會過期，也可能遭到撤銷。進行新設定時，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理程式各自設定**；新代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行初始設定（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的認證資訊'>
    執行 `openclaw models status` 以查看目前使用中的驗證設定檔。請重新執行初始設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部處於冷卻期）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 的速率限制冷卻期可能僅套用於特定模型，因此另一個 Anthropic 模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻期結束。
  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting)與[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端的設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨供應商運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
