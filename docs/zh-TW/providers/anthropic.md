---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想要跨已配對的電腦瀏覽 Claude 命令列介面或 Claude Desktop 工作階段
summary: 透過 API 金鑰或 Claude 命令列介面，在 OpenClaw 中使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-22T10:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b044f4c0acb8e158cea7d6dc6fdac3763fc86f45d6c6bbbcc2256d42033f1b5
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型系列。OpenClaw 支援兩種驗證方式：

- **API 金鑰** - 直接存取 Anthropic API，採用量計費（`anthropic/*` 模型）
- **Claude CLI** - 重複使用同一主機上現有的 Claude Code 登入

## 用量與費用追蹤

OpenClaw 會偵測可用的 Anthropic 認證資訊，並選擇相符的用量介面：

- Claude 訂閱／設定認證資訊會顯示配額週期及選用的額外用量預算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 會在控制介面的 **用量** 中顯示供應商回報的 30 天組織費用與 Messages API 用量，包括每日支出、權杖／快取總量、最常用模型及費用類別。
- 儲存在 Anthropic 供應商設定檔中的 `sk-ant-admin...` 認證資訊，會自動被偵測為 Admin API 金鑰。

Admin API 費用記錄來自 Anthropic 的[用量與費用 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。這是供應商的實際帳單，與 OpenClaw 根據工作階段推算的預估費用分開計算。

<Warning>
OpenClaw 的 Claude CLI 後端會以非互動式列印模式
（`claude -p`）執行已安裝的 Claude Code CLI。Anthropic 目前的 Claude Code 文件
將該模式描述為 Agent SDK／程式化用法。Anthropic 於 2026 年 6 月 15 日發布的
支援更新暫停了原先宣布的獨立 Agent SDK 計費變更：Claude
Agent SDK、`claude -p` 及第三方應用程式的用量仍會計入已登入
訂閱方案的用量限制；在 Anthropic 修訂該方案期間，先前宣布的每月 Agent SDK
額度並不可用。

互動式 Claude Code 的用量仍會計入已登入 Claude 方案的限制。
API 金鑰驗證採直接隨用隨付計費，不依賴該方案。
對於長期運作的閘道主機、共用自動化，以及需要可預測的正式環境
支出，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能在 OpenClaw 未發布新版本的情況下
變更此行為：

- [Claude Code CLI 參考資料](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 費用](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取與用量計費。

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

  <Tab title="Claude CLI">
    **最適合：**在不使用個別 API 金鑰的情況下，重複使用現有的 Claude CLI 登入。

    <Steps>
      <Step title="確認 Claude CLI 已安裝並登入">
        使用下列指令確認：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # 選擇：Claude CLI
        ```

        OpenClaw 會偵測並重複使用現有的 Claude CLI 認證資訊。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 後端的設定與執行階段詳細資訊，請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    重複使用 Claude CLI 時，OpenClaw 程序必須與
    Claude CLI 登入在同一台主機上執行。Docker 安裝可以持久保存容器的家目錄，並在其中登入
    Claude Code；請參閱
    [Docker 中的 Claude CLI 後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    [Podman](/zh-TW/install/podman) 等其他容器安裝不會在設定或執行階段掛載主機的
    `~/.claude`；請改用 Anthropic API 金鑰，或選擇
    由 OpenClaw 管理 OAuth 的供應商，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 取得設定權杖

    在任何已安裝 Claude Code 的機器上執行 `claude setup-token`。它會輸出
    一個以 `sk-ant-oat01-` 開頭的長效權杖。

    在初始設定期間，於 macOS 應用程式的 **Connect with an API key or token** 下選擇
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
    但新設定應將供應商／模型選擇維持為
    `anthropic/*`，並將執行後端放在供應商／模型的執行階段政策中。

    ### 計費與 `claude -p`

    OpenClaw 會使用 Claude Code 的非互動式 `claude -p` 路徑執行 Claude CLI。
    Anthropic 目前將該路徑視為 Agent SDK／程式化用法：

    - Anthropic 於 2026 年 6 月 15 日發布的支援更新，暫停了先前宣布的
      獨立 Agent SDK 額度方案。
    - 訂閱方案下的 Claude Agent SDK、`claude -p` 及第三方應用程式用量
      仍會計入已登入訂閱方案的用量限制。
    - 在 Anthropic 修訂該方案期間，先前宣布的每月 Agent SDK 額度
      並不可用。
    - Console／API 金鑰登入採用隨用隨付的 API 計費，且不會獲得
      訂閱方案的 Agent SDK 額度。

    如需瞭解暫停通知，請參閱 Anthropic 的 [Agent SDK 方案
    文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)；
    如需瞭解訂閱方案行為，請參閱 Claude Code 方案的
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    文章。

    Anthropic 可以在 OpenClaw 未發布新版本的情況下，變更 Claude Code 的計費與速率限制行為。
    當計費的可預測性很重要時，請檢查 `claude auth status`、`/status` 及
    Anthropic 的連結文件。

    <Tip>
    對於共用的正式環境自動化，請使用 Anthropic API 金鑰，而不是
    Claude CLI。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 及 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 跨電腦的 Claude 工作階段

隨附的 Anthropic 外掛會在一般工作階段側邊欄中新增 **Claude Code** 群組。
各列會在一般聊天窗格中開啟。它會在閘道及已連線的節點主機上探索未封存的 Claude
Code 工作階段：

- Claude CLI 工作階段來自有效的專案索引記錄。對於未建立索引的
  轉錄內容，範圍受限的中繼資料備援機制會辨識 `~/.claude/projects/` 下同時存在的非側鏈
  互動式（`cli`）及無介面 Agent SDK CLI（`sdk-cli`）工作階段。
- 當 Claude Desktop 的中繼資料指向相同的 Claude Code 工作階段 ID 時，
  Claude Desktop 工作階段會使用 Desktop 標題、活動時間及
  封存狀態。
- 僅限命令列介面的工作階段沒有封存旗標，因此只要其
  轉錄內容仍存在，就會持續顯示。

探索功能不需要額外的 OpenClaw 設定。Anthropic 外掛
已隨附並預設啟用；當本機 `~/.claude/projects/` 目錄存在時，原生 macOS 節點會公告唯讀的
Claude 工作階段命令。這些命令首次出現時，請核准節點配對升級。

側邊欄會依閘道或已配對的節點主機分組各列，並在每台電腦回應後立即顯示該
主機最新且範圍受限的頁面。它會在主機連線狀態變更後、頁面重新取得焦點時，以及可見期間最多每
30 秒重新協調一次，因此在 OpenClaw 外部建立的 Claude 工作階段
無須重新載入即可出現。目錄變更時會更快進行後續處理。使用目錄群組下方的 **載入更多
工作階段**，可為每個仍有更多歷史記錄的主機附加下一頁；附加的列會保持可見，並在
重新整理時重新擷取至相同深度。目錄用戶端使用 `sessions.catalog.list`；開啟資料列則使用
`sessions.catalog.read`。

終端機接管功能會先從所屬主機使用者的登入 Shell
PATH 解析 `claude`，之後才使用服務／常駐程式的 PATH。這可讓由應用程式啟動的工作階段
與操作者在一般終端機中取得的 Claude CLI 保持一致。

選取資料列時，會先讀取最新的轉錄內容頁面。**載入較舊的轉錄內容
項目**會依循不透明的位元組游標，從 JSONL 檔案讀取另一個範圍受限的區段，
而非載入完整記錄。一般的使用者、助理、
推理、工具呼叫及工具結果內容都會保留。若個別項目
超過節點／閘道的安全上限，系統會清楚標示為已截斷。

對於閘道本機的 `claude-cli` 資料列，在一般撰寫器中輸入內容會呼叫
`sessions.catalog.continue`。OpenClaw 會重新解析本機目錄記錄、
建立或重複使用鎖定模型的原生工作階段、匯入最多 200 個可見
項目或 512 KiB，並植入 Claude CLI 繫結。第一輪會使用
`--fork-session` 繼續；Claude 會為分支指派新的工作階段 ID，因此後續輪次會使用
該分支，而來源工作階段不會受到變更。

無介面節點主機也可以啟用下列節點本機設定並重新啟動節點主機，
讓其 Claude CLI 資料列可繼續執行：

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

只有在此設定已啟用，且其本機 `claude` 可執行檔可解析時，
節點才會公告 `agent.cli.claude.run.v1`。OpenClaw 會在該節點重新解析目錄
記錄、匯入相同的範圍受限記錄，並將接管的
工作階段繫結至該節點與目錄回報的工作目錄。每一輪都會使用該節點的 Claude 檔案與登入，
執行該節點真正的 `claude -p` 程序。節點的執行核准政策仍然適用；
閘道無法強制啟用此選項。

節點繼續執行 v1 僅限單次使用。它會省略閘道回送 MCP 設定與
閘道 Skills 外掛引數、不會從閘道轉錄內容重新植入，
並拒絕附件與圖片。Claude Desktop 資料列仍然只能檢視。原生
macOS 應用程式節點在應用程式公告執行命令前，也仍然只能檢視。

<Note>
除非無介面節點明確公告 `agent.cli.claude.run.v1`，否則已配對節點的 Claude 工作階段仍為唯讀。
OpenClaw 絕不會修改 Claude Desktop
中繼資料或封存 Claude 工作階段。此頁面需要具備寫入範圍的操作者連線，
因為它會使用已驗證的 `node.invoke`；即使節點已啟用繼續執行，列出與讀取操作
仍然是唯讀。
</Note>

請參閱[節點：Claude 工作階段與逐字稿](/zh-TW/nodes#claude-sessions-and-transcripts)，
以瞭解節點命令與安全邊界。

## 思考預設值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 與 4.6）

`anthropic/claude-sonnet-5` 預設使用 `high` 力度的自適應思考。
使用 `/think off` 可停用思考，或使用 `/think xhigh|max` 啟用模型原生的
較高力度等級。由於 Anthropic 不支援在此模型的請求中使用這些功能，
OpenClaw 會為 Sonnet 5 省略手動思考預算、自訂取樣參數、助理預填，
以及 Priority Tier。
目錄採用 Anthropic 的入門優惠 `$2/$10` 輸入／輸出定價，至
2026 年 8 月 31 日為止；標準 `$3/$15` 定價將自 2026 年 9 月 1 日起生效。

`anthropic/claude-fable-5` 一律使用自適應思考，且預設為 `high`
力度。Anthropic 不允許停用此模型的思考，因此
`/think off` 與 `/think minimal` 會改為對應至 `low` 力度。由於 Anthropic
會拒絕任何已啟用思考之請求中的溫度覆寫，OpenClaw 也會從 Fable 5
請求中省略自訂溫度值。

`anthropic/claude-mythos-5` 是受限存取模型，採用相同的一律啟用
自適應思考合約。OpenClaw 預設使用 `high`，將 `/think off` 與
`/think minimal` 對應至 `low`，並省略呼叫端選擇的取樣參數。
目錄公布其 1,000,000 個權杖的上下文視窗、128,000 個權杖的輸出
上限、影像輸入，以及 `$10/$50` 輸入／輸出定價。

Claude Opus 4.8 在 OpenClaw 中預設停用思考。當你使用
`/think high|xhigh|max` 明確啟用自適應思考時，OpenClaw 會傳送
Anthropic 的 Opus 4.8 力度值；Claude 4.6 模型（Opus 4.6 與 Sonnet 4.6）
預設為 `adaptive`。

使用 `/think:<level>` 針對每則訊息覆寫，或在模型參數中設定：

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
使用 Claude Fable 5 也代表會使用 Claude Opus 4.8。Fable 5 內建
可能拒絕請求的安全分類器，而 Anthropic 核准的復原方式是由
`claude-opus-4-8` 處理該次互動。OpenClaw 會針對直接使用 API 金鑰的請求
自動選用此機制，因此部分 Fable 互動會由 Claude Opus 4.8 回答並計費。
如果你的政策或預算無法接受由 Opus 處理的互動，請勿選取
`anthropic/claude-fable-5`。
</Warning>

### 為何需要此機制

Fable 5 分類器會對受限制領域的請求傳回 `stop_reason: "refusal"`，
也會對接近但無害的工作產生誤判（例如安全工具、生命科學，甚至要求模型
重現其原始推理）。若沒有備援，即使其他 Claude 模型願意處理，該次互動
仍會以錯誤結束——Anthropic 自己的拒絕訊息會指示 API 整合者設定備援模型。

### 運作方式

1. 對 `anthropic/claude-fable-5` 的每個直接 API 金鑰請求，OpenClaw
   都會傳送 Anthropic 的伺服器端備援選用設定：
   `server-side-fallback-2026-06-01` Beta 標頭以及
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 唯一允許用於
   Fable 5 的備援目標。
2. 只有安全分類器拒絕才會觸發備援。速率限制、
   過載與伺服器錯誤的行為完全維持不變，並透過
   OpenClaw 的一般[模型容錯移轉](/zh-TW/concepts/model-failover)處理。
3. 救援會在同一次呼叫內進行。若在產生任何輸出前遭到拒絕，
   除了延遲之外完全無法察覺；整個答案都來自 Opus 4.8。若串流途中遭到拒絕，
   部分文字會保留為備援模型接續產生內容的前綴，而遭拒模型的推理與工具呼叫
   則會依照 Anthropic 的重播規則捨棄（不得將其回傳或執行）。
4. 若 Claude Opus 4.8 也拒絕，該次互動會將拒絕顯示為
   錯誤，與此功能推出前完全相同。

備援發生在 Anthropic API 層級，因此你的已設定模型清單或備援鏈中
不必包含 `claude-opus-4-8`——支援 Fable 的 API 金鑰一律可處理 Opus。

### 可觀測性與計費

- 由備援處理的互動會在助理訊息中記錄 `provider_fallback` 診斷，
  指明 `fromModel` 與 `toModel`，且訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 會依每次嘗試計費：在輸出前遭拒不收費，而救援
  會依 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的
  每次互動成本估算會依 Opus 費率計算由備援處理的互動，以保持一致。
- 若在串流途中遭拒，Anthropic 還會額外對已串流的 Fable 部分
  計費；該部分會回報在 API 的每次嘗試用量中，但不會納入 OpenClaw 的
  每次互動估算。

### 適用範圍

適用於使用 API 金鑰向 `api.anthropic.com` 進行驗證的
`anthropic/claude-fable-5`。OAuth（重複使用 Claude CLI 訂閱）、代理伺服器基底 URL、
Bedrock、Vertex 與 Foundry 請求均不受影響，且仍會在這些環境中將拒絕顯示為錯誤。

即時驗證：若不使用備援，要求 Fable 5 重現其原始思維鏈的無害提示會以
`category: "reasoning_extraction"` 遭到拒絕；透過 OpenClaw 傳送相同提示，則會傳回由 Opus
處理的一般答案，並附上 `provider_fallback` 診斷。

如需瞭解底層行為，請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示詞快取

OpenClaw 支援 Anthropic 的 API 金鑰驗證提示詞快取功能。

| 值               | 快取時間 | 說明                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（預設） | 5 分鐘      | 自動套用於 API 金鑰驗證 |
| `"long"`            | 1 小時         | 延長快取                         |
| `"none"`            | 不快取     | 停用提示詞快取                 |

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
  <Accordion title="每個代理程式的快取覆寫">
    以模型層級參數作為基準，再透過 `agents.entries.*.params` 覆寫特定代理程式：

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
    2. `agents.entries.*.params`（符合 `id`，依鍵覆寫）

    如此可讓一個代理程式保留長期快取，同時讓使用相同模型的另一個代理程式針對突發性／低重複使用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型會在執行階段強制設為 `cacheRetention: "none"`。
    - 未設定明確值時，API 金鑰智慧預設值也會為 Bedrock 上的 Claude 參照填入 `cacheRetention: "short"`。

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
    - 僅適用於使用 API 金鑰發出的直接 `api.anthropic.com` 請求。OAuth／訂閱權杖請求和代理路由絕不會收到 `service_tier` 欄位。
    - 同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 對於沒有 Priority Tier 容量的帳戶，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片和 PDF）">
    隨附的 Anthropic 外掛會註冊圖片和 PDF 理解功能。OpenClaw
    會根據已設定的 Anthropic 驗證自動解析媒體功能；不需要
    額外設定。

    | 屬性            | 值                    |
    | --------------- | --------------------- |
    | 預設模型        | `claude-opus-4-8`     |
    | 支援的輸入      | 圖片、PDF 文件         |

    對話中附加圖片或 PDF 時，OpenClaw 會自動
    透過 Anthropic 媒體理解提供者路由處理。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Claude Sonnet 5、Mythos 5 和 Fable 5 具有精確的 1,000,000 權杖輸入
    視窗，並支援最多 128,000 個輸出權杖。Anthropic 的 1M 上下文
    視窗也已在採用自適應思考的 Claude 4.x 模型上正式推出：Opus 4.8、
    Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動調整這些模型
    的大小，不需要 `params.context1m`：

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

    較舊的設定可以保留 `params.context1m: true`；對於這些模型，這是無害且
    不執行任何動作的設定，而無論如何，OpenClaw 都不再傳送已淘汰的
    `context-1m-2025-08-07` beta 標頭。較舊的 `anthropicBeta` 設定
    項目若含有該值，會在解析請求標頭時遭到捨棄，而不支援的較舊
    Claude 模型則會維持其一般上下文視窗。

    對於 Claude 命令列介面後端（`claude-cli/*`），`params.context1m: true`
    的行為也相同：符合資格且具備正式推出功能的 Opus 和 Sonnet 模型已會
    自動取得 1M 視窗，因此該參數在此也為選用。

    <Warning>
    你的 Anthropic 認證資訊必須具備長上下文存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic beta 標頭，但若已淘汰的 1M beta 標頭仍存在於較舊的設定中，OpenClaw 會將其移除。
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
    Anthropic 權杖驗證會過期，也可能遭到撤銷。新設定請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理程式各自設定**；新的代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行新手設定（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的認證資訊'>
    執行 `openclaw models status`，查看目前使用中的驗證設定檔。重新執行新手設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 的速率限制冷卻可能限定於特定模型，因此同系列的其他 Anthropic 模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端設定與執行階段詳細資訊。
  </Card>
  <Card title="提示詞快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示詞快取在各提供者之間的運作方式。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
