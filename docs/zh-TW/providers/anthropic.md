---
read_when:
    - 你想要在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-06T21:54:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c19e88b2461e5d98a02044867625a2d508821a4ab43aeb3e10a7a493efbcca22
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型家族。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** - 直接存取 Anthropic API，採用依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** - 重用同一主機上既有的 Claude Code 登入

## 用量與成本追蹤

OpenClaw 會偵測可用的 Anthropic 認證，並選擇相符的用量介面：

- Claude 訂閱/設定認證會顯示配額時段與選用的額外用量預算。
- `ANTHROPIC_ADMIN_KEY` 或 `ANTHROPIC_ADMIN_API_KEY` 會在 Control UI **用量** 中顯示 30 天由提供者回報的組織成本與 Messages API 用量，包括每日支出、權杖/快取總計、熱門模型與成本類別。
- 儲存在 Anthropic 提供者設定檔中的 `sk-ant-admin...` 認證會自動偵測為 Admin API 金鑰。

Admin API 成本歷史來自 Anthropic 的[用量與成本 API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)。這是實際的提供者帳單，與 OpenClaw 從工作階段推導出的估算成本分開。

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式
（`claude -p`）執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件
將該模式描述為 Agent SDK/程式化用法。Anthropic 於 2026 年 6 月 15 日的
支援更新暫停了先前宣布的獨立 Agent SDK 計費變更：Claude
Agent SDK、`claude -p` 與第三方應用程式用量仍會消耗已登入
訂閱的用量限制，而先前宣布的每月 Agent SDK
額度在 Anthropic 修訂該方案期間不可用。

互動式 Claude Code 仍會消耗已登入 Claude 方案的限制。
API 金鑰驗證是直接按量付費帳單，並不依賴該方案。
對於長期執行的閘道主機、共享自動化與可預測的生產環境
支出，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能在沒有
OpenClaw 版本發布的情況下變更此行為：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：** 標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        在 [Anthropic Console](https://console.anthropic.com/) 建立 API 金鑰。
      </Step>
      <Step title="執行入門設定">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="驗證模型可用">
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
    **最適合：** 在沒有獨立 API 金鑰的情況下，重用既有的 Claude 命令列介面登入。

    <Steps>
      <Step title="確認 Claude 命令列介面已安裝並已登入">
        使用以下指令驗證：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行入門設定">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用既有的 Claude 命令列介面認證。
      </Step>
      <Step title="驗證模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude 命令列介面後端的設定與執行階段詳細資訊位於[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude 命令列介面重用預期 OpenClaw 程序會在與
    Claude 命令列介面登入相同的主機上執行。Docker 安裝可以持久化容器 home，並在其中登入
    Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    其他容器安裝（例如 [Podman](/zh-TW/install/podman)）不會將主機
    `~/.claude` 掛載到設定或執行階段；請在該環境使用 Anthropic API 金鑰，或選擇
    具有 OpenClaw 管理 OAuth 的提供者，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 設定範例

    偏好使用標準 Anthropic 模型參照加上命令列介面執行階段覆寫：

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

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可基於
    相容性運作，但新的設定應將提供者/模型選擇保持為
    `anthropic/*`，並將執行後端放在提供者/模型執行階段政策中。

    ### 帳單與 `claude -p`

    OpenClaw 會使用 Claude Code 的非互動式 `claude -p` 路徑來執行 Claude 命令列介面
    工作。Anthropic 目前將該路徑視為 Agent SDK/程式化用法：

    - Anthropic 於 2026 年 6 月 15 日的支援更新暫停了先前宣布的
      獨立 Agent SDK 額度方案。
    - 訂閱方案的 Claude Agent SDK、`claude -p` 與第三方應用程式用量
      仍會消耗已登入訂閱的用量限制。
    - 先前宣布的每月 Agent SDK 額度在
      Anthropic 修訂該方案期間不可用。
    - Console/API 金鑰登入使用按量付費 API 帳單，且不會收到
      訂閱 Agent SDK 額度。

    請參閱 Anthropic 的 [Agent SDK 方案
    文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    以了解暫停通知，並參閱 Claude Code 方案文章以了解
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    訂閱行為。

    Anthropic 可以在沒有
    OpenClaw 版本發布的情況下變更 Claude Code 帳單與速率限制行為。當帳單可預測性很重要時，請檢查 `claude auth status`、`/status` 與
    Anthropic 連結的文件。

    <Tip>
    對於共享的生產環境自動化，請使用 Anthropic API 金鑰，而不是
    Claude 命令列介面。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 與 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude Fable 5、4.8 與 4.6）

`anthropic/claude-fable-5` 一律使用自適應思考，並預設為 `high`
努力程度。Anthropic 不允許停用此模型的思考，因此
`/think off` 與 `/think minimal` 會改對應到 `low` 努力程度。OpenClaw 也會
省略 Fable 5 請求的自訂 temperature 值，因為 Anthropic 會拒絕
任何啟用思考請求上的 temperature 覆寫。

Claude Opus 4.8 在 OpenClaw 中預設關閉思考。當你明確
使用 `/think high|xhigh|max` 啟用自適應思考時，OpenClaw 會傳送
Anthropic 的 Opus 4.8 努力程度值；Claude 4.6 模型（Opus 4.6 與 Sonnet 4.6）
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
使用 Claude Fable 5 也代表使用 Claude Opus 4.8。Fable 5 隨附
安全分類器，可能會拒絕某個請求，而 Anthropic 核准的
復原方式是讓 `claude-opus-4-8` 提供該回合。OpenClaw 會針對直接 API 金鑰請求自動選用此機制，因此某些 Fable 回合會由 Claude Opus 4.8 回答
並以 Claude Opus 4.8 計費。如果你的政策或預算不能接受
由 Opus 提供的回合，請不要選擇 `anthropic/claude-fable-5`。
</Warning>

### 為什麼存在此機制

Fable 5 分類器會針對受限
領域的請求回傳 `stop_reason: "refusal"`，也會對良性相鄰工作產生誤判（安全性
工具、生命科學，甚至要求模型重現其原始
推理）。如果沒有備援，即使
另一個 Claude 模型可以正常提供服務，該回合仍會因錯誤而中止 - Anthropic 自己的拒絕訊息
會告知 API 整合者設定備援模型。

### 運作方式

1. 對於每個傳送到 `anthropic/claude-fable-5` 的直接 API 金鑰請求，OpenClaw
   會傳送 Anthropic 的伺服器端備援選用設定：即
   `server-side-fallback-2026-06-01` beta 標頭加上
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 允許 Fable 5 使用的唯一
   備援目標。
2. 只有安全分類器拒絕會觸發備援。速率限制、
   過載與伺服器錯誤會與之前完全相同，並經由
   OpenClaw 一般的[模型容錯移轉](/zh-TW/concepts/model-failover)。
3. 救援發生在同一次呼叫內。在任何輸出前發生的
   拒絕，除了延遲外不可見；整個回答都來自 Opus 4.8。在
   串流中途拒絕時，部分文字會保留為備援
   模型繼續生成的前綴，而被拒絕模型的推理與工具呼叫
   會依 Anthropic 的重播規則被丟棄（它們不得被回顯或
   執行）。
4. 如果 Claude Opus 4.8 也拒絕，該回合會將拒絕作為
   錯誤呈現，與此功能之前完全相同。

備援發生在 Anthropic API 層級，因此 `claude-opus-4-8` 不
需要出現在你設定的模型清單或備援鏈中 - 可使用 Fable 的
API 金鑰一律可以提供 Opus。

### 可觀測性與帳單

- 由備援提供服務的回合會在
  assistant 訊息上記錄一個 `provider_fallback` 診斷，命名 `fromModel` 與 `toModel`，且該訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 會依嘗試次數計費：輸出前的拒絕免費，而救援
  會以 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的
  每回合成本估算會以 Opus 費率為由備援提供服務的回合定價，以保持一致。
- 串流中途拒絕還會在 Anthropic 端額外計費已串流的 Fable 部分；
  該部分會在 API 的每次嘗試
  用量中回報，但不會納入 OpenClaw 的每回合估算。

### 範圍

適用於使用 API 金鑰驗證、對
`api.anthropic.com` 的 `anthropic/claude-fable-5`。OAuth（Claude 命令列介面訂閱重用）、代理基底 URL、
Bedrock、Vertex 與 Foundry 請求不變，且在那些環境中仍會將
拒絕呈現為錯誤。

已即時驗證：一個要求 Fable 5 重現其原始思維鏈的良性提示，在沒有
備援的情況下傳送時會以 `category: "reasoning_extraction"` 被拒絕，而相同提示透過 OpenClaw 會回傳正常、由 Opus 提供的
回答，並附加 `provider_fallback` 診斷。

請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
以了解底層行為。

## 提示快取

OpenClaw 支援 Anthropic 的提示快取功能，用於 API 金鑰驗證。

| 值                  | 快取持續時間 | 說明                                       |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（預設） | 5 分鐘      | 會自動套用於 API 金鑰驗證 |
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
  <Accordion title="每個代理的快取覆寫">
    使用模型層級參數作為基準，然後透過 `agents.list[].params` 覆寫特定代理：

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

    這讓一個代理可以保留長效快取，而同一個模型上的另一個代理可針對突發性或低重複使用率的流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後會接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。
    - 若未設定明確值，API 金鑰智慧預設值也會為 Claude-on-Bedrock 參照植入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換會為直接連到 `api.anthropic.com` 的 API 金鑰流量設定 Anthropic 的 `service_tier` 欄位。

    | 命令 | 對應到 |
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
    - 只會套用於使用 API 金鑰直接送出的 `api.anthropic.com` 請求。OAuth/訂閱權杖請求與代理路由永遠不會取得 `service_tier` 欄位。
    - 同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳戶上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建 Anthropic 外掛會註冊圖片與 PDF 理解。OpenClaw
    會根據設定的 Anthropic 驗證自動解析媒體功能；不需要
    額外設定。

    | 屬性        | 值                 |
    | --------------- | --------------------- |
    | 預設模型   | `claude-opus-4-8`     |
    | 支援的輸入 | 圖片、PDF 文件 |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動
    透過 Anthropic 媒體理解提供者路由它。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Anthropic 的 1M 上下文視窗已在具備自適應
    思考的 Claude 4.x 模型上正式可用：Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動將這些
    模型大小設為 1,048,576 個權杖，不需要 `params.context1m`：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    較舊設定可以保留 `params.context1m: true`；對這些模型而言這是無害的 no-op，
    而且無論如何 OpenClaw 都不再送出已淘汰的
    `context-1m-2025-08-07` beta 標頭。較舊的 `anthropicBeta` 設定
    項目若帶有該值，會在請求標頭解析期間被移除，而
    不支援的較舊 Claude 模型會維持其一般上下文視窗。

    `params.context1m: true` 對 Claude 命令列介面後端
    （`claude-cli/*`）的行為相同：符合正式可用能力的 Opus 和 Sonnet 模型已經會自動取得
    1M 視窗，因此該參數在那裡也是選用的。

    <Warning>
    需要你的 Anthropic 憑證具備長上下文存取權。OAuth/訂閱權杖驗證會保留其必要的 Anthropic beta 標頭，但若已淘汰的 1M beta 標頭仍存在於較舊設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具備 1M 上下文
    視窗；不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤 / 權杖突然無效">
    Anthropic 權杖驗證會過期，也可能被撤銷。若是新的設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理各自設定**；新代理不會繼承主代理的金鑰。請為該代理重新執行 onboarding（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的憑證'>
    執行 `openclaw models status` 查看目前使用中的驗證設定檔。重新執行 onboarding，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部處於冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能是模型範圍，因此同層級的 Anthropic 模型可能仍可使用。新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting) 與 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨提供者運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重複使用規則。
  </Card>
</CardGroup>
