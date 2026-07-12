---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
    - 你想要瀏覽配對電腦上的 Claude 命令列介面或 Claude Desktop 工作階段
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T14:44:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 打造了 **Claude** 模型系列。OpenClaw 支援兩種驗證途徑：

- **API 金鑰** - 直接存取 Anthropic API，依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** - 重複使用同一主機上現有的 Claude Code 登入狀態

## 用量與費用追蹤

OpenClaw 會偵測可用的 Anthropic 認證資訊，並選擇相符的用量介面：

- Claude 訂閱／設定認證資訊會顯示配額週期，以及選用的額外用量預算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 會在 Control UI 的 **用量** 中顯示供應商回報的 30 天組織費用與 Messages API 用量，包括每日支出、權杖／快取總量、熱門模型與費用類別。
- 儲存在 Anthropic 供應商設定檔中的 `sk-ant-admin...` 認證資訊，會自動偵測為 Admin API 金鑰。

Admin API 費用記錄來自 Anthropic 的[用量與費用 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。這是供應商實際計費，與 OpenClaw 根據工作階段推算的預估費用分開計算。

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式（`claude -p`）執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件將此模式描述為 Agent SDK／程式化使用。Anthropic 於 2026 年 6 月 15 日發布的支援更新，暫緩了先前宣布的獨立 Agent SDK 計費變更：Claude Agent SDK、`claude -p` 和第三方應用程式用量仍會計入已登入訂閱方案的用量限制，而 Anthropic 修改該方案期間，先前宣布的每月 Agent SDK 額度將不會提供。

互動式 Claude Code 仍會計入已登入 Claude 方案的用量限制。API 金鑰驗證採直接隨用隨付計費，不依賴該方案。對於長期運作的閘道主機、共用自動化和需要可預測正式環境支出的情境，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能在 OpenClaw 未發布新版本的情況下變更此行為：

- [Claude Code 命令列介面參考資料](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 費用](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
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
    **最適合：**重複使用現有的 Claude 命令列介面登入狀態，而不需另外使用 API 金鑰。

    <Steps>
      <Step title="確認已安裝並登入 Claude 命令列介面">
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
    Claude 命令列介面後端的設定與執行階段詳細資訊，請參閱[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    重複使用 Claude 命令列介面時，OpenClaw 程序必須與 Claude 命令列介面登入狀態位於同一主機。Docker 安裝可保留容器的家目錄，並在其中登入 Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    [Podman](/zh-TW/install/podman) 等其他容器安裝不會在設定或執行階段將主機的
    `~/.claude` 掛載至容器；請在其中使用 Anthropic API 金鑰，或選擇具有 OpenClaw 管理 OAuth 的供應商，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 設定範例

    建議使用標準 Anthropic 模型參照，並搭配命令列介面執行階段覆寫：

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

    為了相容性，舊版 `claude-cli/claude-opus-4-7` 模型參照仍可運作，但新設定應將供應商／模型選擇維持為
    `anthropic/*`，並將執行後端置於供應商／模型執行階段原則中。

    ### 計費與 `claude -p`

    OpenClaw 執行 Claude 命令列介面時，會使用 Claude Code 的非互動式 `claude -p` 路徑。Anthropic 目前將此路徑視為 Agent SDK／程式化使用：

    - Anthropic 於 2026 年 6 月 15 日發布的支援更新，暫緩了先前宣布的獨立 Agent SDK 額度方案。
    - 訂閱方案的 Claude Agent SDK、`claude -p` 和第三方應用程式用量，仍會計入已登入訂閱方案的用量限制。
    - Anthropic 修改該方案期間，先前宣布的每月 Agent SDK 額度將不會提供。
    - Console／API 金鑰登入採隨用隨付 API 計費，且不會獲得訂閱方案的 Agent SDK 額度。

    如需查看暫緩公告，請參閱 Anthropic 的 [Agent SDK 方案文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)；如需了解訂閱行為，請參閱 Claude Code 的
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    方案文章。

    Anthropic 可以在 OpenClaw 未發布新版本的情況下，變更 Claude Code 的計費與速率限制行為。若計費的可預測性很重要，請查看 `claude auth status`、`/status` 以及 Anthropic 的連結文件。

    <Tip>
    對於共用的正式環境自動化，請使用 Anthropic API 金鑰，而非 Claude 命令列介面。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 與 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 跨電腦的 Claude 工作階段

隨附的 Anthropic 外掛會在一般工作階段側邊欄中新增 **Claude Code** 群組。各列會在一般聊天窗格中開啟。它會探索閘道及已連線節點主機上未封存的 Claude Code 工作階段：

- Claude 命令列介面工作階段來自有效的專案索引記錄，以及位於 `~/.claude/projects/` 下、其受限中繼資料前綴識別為非側鏈 `sdk-cli` 工作階段的目前 JSONL 檔案。
- 當 Claude Desktop 的中繼資料指向相同的 Claude Code 工作階段 ID 時，Claude Desktop 工作階段會使用 Desktop 標題、活動時間和封存狀態。
- 僅有命令列介面的工作階段沒有封存旗標，因此只要其逐字記錄仍存在，就會維持可見。

不需要額外的 OpenClaw 設定。Anthropic 外掛已隨附且預設啟用；當本機 `~/.claude/projects/` 目錄存在時，原生 macOS 節點會宣告唯讀的 Claude 工作階段命令。這些命令首次出現時，請核准節點配對升級。

側邊欄一開始會顯示各主機最新的受限頁面，並依一般的 30 秒週期重新整理。使用目錄群組下方的 **載入更多工作階段**，為每個仍有更多記錄的主機附加下一頁；附加的列會保持可見，並在重新整理時重新擷取至相同深度。目錄用戶端使用 `sessions.catalog.list`；開啟一列則使用 `sessions.catalog.read`。

選取一列時，會先讀取最新的逐字記錄頁面。**載入較舊的逐字記錄項目**會沿用不透明的位元組游標，從 JSONL 檔案讀取另一個受限區段，而非載入完整記錄。一般的使用者、助理、推理、工具呼叫與工具結果內容都會保留。若單一項目超過節點／閘道的安全上限，系統會清楚標示為已截斷。

對於閘道本機的 `claude-cli` 列，在一般撰寫框中輸入內容會呼叫 `sessions.catalog.continue`。OpenClaw 會重新解析本機目錄記錄、建立或重複使用鎖定模型的原生工作階段、匯入最多 200 個可見項目或 512 KiB，並初始化 Claude 命令列介面繫結。第一輪會使用 `--fork-session` 繼續；Claude 會為分支指派新的工作階段 ID，因此後續輪次會使用該分支，而來源工作階段保持不變。Claude Desktop 與配對節點上的列僅供檢視。

<Note>
配對節點上的 Claude 工作階段為唯讀。OpenClaw 不會修改 Claude Desktop 中繼資料、封存 Claude 工作階段，或在所屬電腦上啟動第二個執行器。此頁面需要具有寫入範圍的操作員連線，因為它使用已驗證的 `node.invoke` 傳輸，即使兩個 Claude 節點命令都是唯讀。
</Note>

請參閱[節點：Claude 工作階段與逐字記錄](/zh-TW/nodes#claude-sessions-and-transcripts)，了解節點命令與安全邊界。

## 思考預設值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 與 4.6）

`anthropic/claude-sonnet-5` 預設會以 `high` 力度使用自適應思考。使用 `/think off` 可停用思考，或使用 `/think xhigh|max` 選擇模型更高的原生力度等級。由於 Anthropic 不支援在此模型的要求中使用這些功能，OpenClaw 對 Sonnet 5 會省略手動思考預算、自訂取樣參數、助理預填內容與 Priority Tier。
目錄採用 Anthropic 的上市優惠輸入／輸出價格 `$2/$10`，有效至 2026 年 8 月 31 日；標準價格 `$3/$15` 將於 2026 年 9 月 1 日開始。

`anthropic/claude-fable-5` 一律使用自適應思考，且預設力度為 `high`。Anthropic 不允許停用此模型的思考功能，因此 `/think off` 與 `/think minimal` 會改對應至 `low` 力度。由於 Anthropic 會拒絕任何已啟用思考之要求中的溫度覆寫，OpenClaw 也會在 Fable 5 要求中省略自訂溫度值。

`anthropic/claude-mythos-5` 是存取受限的模型，採用相同的永遠啟用自適應思考合約。OpenClaw 預設使用 `high`，將 `/think off` 與 `/think minimal` 對應至 `low`，並省略呼叫者選取的取樣參數。
目錄會發布其 1,000,000 權杖的上下文視窗、128,000 權杖的輸出限制、圖片輸入，以及 `$10/$50` 的輸入／輸出價格。

Claude Opus 4.8 在 OpenClaw 中預設關閉思考功能。當你使用 `/think high|xhigh|max` 明確啟用自適應思考時，OpenClaw 會傳送 Anthropic 的 Opus 4.8 力度值；Claude 4.6 模型（Opus 4.6 與 Sonnet 4.6）則預設為 `adaptive`。

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
使用 Claude Fable 5 也表示會使用 Claude Opus 4.8。Fable 5 隨附的
安全分類器可能會拒絕請求，而 Anthropic 核准的復原方式是讓
`claude-opus-4-8` 處理該次互動。對於直接使用 API 金鑰的請求，OpenClaw
會自動選用此機制，因此部分 Fable 互動會由 Claude Opus 4.8 回答，
並按 Claude Opus 4.8 計費。如果你的政策或預算無法接受
由 Opus 處理的互動，請勿選擇 `anthropic/claude-fable-5`。
</Warning>

### 此功能存在的原因

Fable 5 分類器會對受限制領域的請求傳回 `stop_reason: "refusal"`，
也可能對相近但無害的工作誤判為陽性（例如安全性工具、
生命科學，甚至是要求模型重現其原始推理）。若沒有備援，該次互動會以錯誤終止，
即使其他 Claude 模型其實願意處理；Anthropic 自己的拒絕訊息會指示
API 整合者設定備援模型。

### 運作方式

1. 對於每個直接使用 API 金鑰向 `anthropic/claude-fable-5` 發出的請求，OpenClaw
   會傳送 Anthropic 的伺服器端備援選用設定：包含
   `server-side-fallback-2026-06-01` beta 標頭，以及
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic
   唯一允許用於 Fable 5 的備援目標。
2. 只有安全分類器拒絕時才會觸發備援。速率限制、
   過載和伺服器錯誤的行為與之前完全相同，並會經過
   OpenClaw 的一般[模型容錯移轉](/zh-TW/concepts/model-failover)。
3. 補救會在同一次呼叫內進行。在產生任何輸出前被拒絕時，
   除了延遲之外不會有任何跡象；完整答案都來自 Opus 4.8。若在串流途中被拒絕，
   已產生的部分文字會保留為前綴，供備援模型接續生成；被拒絕模型的推理和工具呼叫
   則會依 Anthropic 的重播規則捨棄（不得將其回傳或執行）。
4. 如果 Claude Opus 4.8 也拒絕，該次互動會將拒絕呈現為錯誤，
   與此功能推出前完全相同。

備援發生在 Anthropic API 層級，因此你的已設定模型清單或備援鏈中
不需要包含 `claude-opus-4-8`；能使用 Fable 的 API 金鑰一律可處理 Opus。

### 可觀測性與計費

- 由備援處理的互動會在助理訊息中記錄 `provider_fallback` 診斷資訊，
  並標示 `fromModel` 和 `toModel`；訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 會按每次嘗試計費：產生輸出前的拒絕不收費，而補救互動
  會按 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw
  的單次互動成本估算會按 Opus 費率計算由備援處理的互動，以保持一致。
- 若在串流途中被拒絕，Anthropic 還會對已串流的 Fable 部分計費；
  該部分會回報在 API 的每次嘗試用量中，但不會納入 OpenClaw
  的單次互動估算。

### 適用範圍

適用於使用 API 金鑰認證，向 `api.anthropic.com` 發出的
`anthropic/claude-fable-5` 請求。OAuth（重複使用 Claude CLI 訂閱）、
代理伺服器基底 URL、Bedrock、Vertex 和 Foundry 請求均維持不變，
在這些情況下仍會將拒絕呈現為錯誤。

已透過實際環境驗證：在未傳送備援設定時，要求 Fable 5 重現其原始思維鏈的
無害提示會以 `category: "reasoning_extraction"` 遭到拒絕；同一提示透過
OpenClaw 傳送時，則會傳回由 Opus 處理的一般答案，並附上
`provider_fallback` 診斷資訊。

如需瞭解底層行為，請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)。

## 提示快取

OpenClaw 支援 Anthropic 適用於 API 金鑰認證的提示快取功能。

| 值                  | 快取期間 | 說明                                  |
| ------------------- | -------- | ------------------------------------- |
| `"short"`（預設值） | 5 分鐘   | 對 API 金鑰認證自動套用               |
| `"long"`            | 1 小時   | 延長快取                              |
| `"none"`            | 不快取   | 停用提示快取                          |

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
  <Accordion title="各代理程式的快取覆寫">
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
    2. `agents.list[].params`（比對 `id`，按鍵覆寫）

    這可讓一個代理程式保留長效快取，同時讓使用相同模型的另一個代理程式針對突發性或低重用率流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後可接受 `cacheRetention` 直接傳遞。
    - 非 Anthropic 的 Bedrock 模型在執行階段會被強制設為 `cacheRetention: "none"`。
    - 若未設定明確值，API 金鑰智慧型預設值也會為 Bedrock 上的 Claude 參照填入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 共用的 `/fast` 切換功能會針對直接使用 API 金鑰傳送至 `api.anthropic.com` 的流量，設定 Anthropic 的 `service_tier` 欄位。

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
    - 僅適用於使用 API 金鑰直接向 `api.anthropic.com` 發出的請求。OAuth／訂閱權杖請求和代理路由絕不會取得 `service_tier` 欄位。
    - 同時設定時，明確指定的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 對於沒有 Priority Tier 容量的帳戶，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片和 PDF）">
    隨附的 Anthropic 外掛會註冊圖片和 PDF 理解功能。OpenClaw
    會根據已設定的 Anthropic 認證自動解析媒體功能，不需要
    任何其他設定。

    | 屬性         | 值                    |
    | ------------ | --------------------- |
    | 預設模型     | `claude-opus-4-8`     |
    | 支援的輸入   | 圖片、PDF 文件        |

    將圖片或 PDF 附加至對話時，OpenClaw 會自動
    將其路由至 Anthropic 媒體理解提供者。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Claude Sonnet 5、Mythos 5 和 Fable 5 具有恰好 1,000,000 個權杖的輸入
    視窗，並支援最多 128,000 個輸出權杖。Anthropic 的 1M 上下文
    視窗也已在具備自適應思考功能的 Claude 4.x 模型正式推出：Opus 4.8、
    Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動設定這些模型的大小，
    不需要 `params.context1m`：

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

    較舊的設定可以保留 `params.context1m: true`；對這些模型而言，
    這是無害且不會產生作用的設定，而且無論如何 OpenClaw 都不再傳送已淘汰的
    `context-1m-2025-08-07` beta 標頭。含有該值的舊版 `anthropicBeta`
    設定項目會在解析請求標頭時遭到移除，而不受支援的舊版 Claude 模型
    仍會使用其一般上下文視窗。

    對 Claude CLI 後端（`claude-cli/*`）而言，`params.context1m: true`
    的行為相同：符合資格且具備正式版功能的 Opus 和 Sonnet 模型已會自動取得
    1M 視窗，因此該參數在此也為選用。

    <Warning>
    你的 Anthropic 認證資訊必須具備長上下文存取權。OAuth／訂閱權杖認證會保留必要的 Anthropic beta 標頭，但若舊版設定中仍含有已淘汰的 1M beta 標頭，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然失效">
    Anthropic 權杖認證會過期，也可能遭到撤銷。對於新設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 認證是**各代理程式分開設定**的；新的代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行上線設定（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的認證資訊'>
    執行 `openclaw models status` 以查看目前使用中的認證設定檔。重新執行上線設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的認證設定檔（全部處於冷卻期）">
    查看 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 的速率限制冷卻可能只套用至特定模型，因此同系列的另一個 Anthropic 模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻期結束。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端的設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取在不同提供者之間的運作方式。
  </Card>
  <Card title="OAuth 與認證" href="/zh-TW/gateway/authentication" icon="key">
    認證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
