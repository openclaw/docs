---
read_when:
    - 您想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-05T11:35:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95930cec942ae6a57221cdca7db88a82a69e1670fd49e9726bba9850303aa9a6
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建立了 **Claude** 模型家族。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** - 透過用量計費直接存取 Anthropic API（`anthropic/*` 模型）
- **Claude 命令列介面** - 在同一主機上重用既有的 Claude Code 登入

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式
（`claude -p`）執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件
將該模式描述為 Agent SDK/程式化使用。Anthropic 2026 年 6 月 15 日的
支援更新暫停了先前宣布的獨立 Agent SDK 計費變更：Claude
Agent SDK、`claude -p` 和第三方應用程式使用量仍會從已登入
訂閱的使用量限制中扣除，而先前宣布的每月 Agent SDK
額度在 Anthropic 修訂該方案期間不可用。

互動式 Claude Code 仍會從已登入 Claude 方案的限制中扣除。
API 金鑰驗證是直接的隨用隨付計費，且不依賴該方案。
對於長期運行的閘道主機、共用自動化，以及可預測的正式環境
支出，請使用 Anthropic API 金鑰。

Anthropic 目前的支援文章可能會在沒有 OpenClaw
發行版的情況下變更此行為：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API key">
    **最適合：** 標準 API 存取和用量計費。

    <Steps>
      <Step title="Get your API key">
        在 [Anthropic Console](https://console.anthropic.com/) 建立 API 金鑰。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    **最適合：** 在沒有獨立 API 金鑰的情況下重用既有的 Claude 命令列介面登入。

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        使用以下命令驗證：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用既有的 Claude 命令列介面認證。
      </Step>
      <Step title="Verify the model is available">
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
    Claude 命令列介面登入相同的主機上執行。Docker 安裝可以持久化容器家目錄並在其中登入
    Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    其他容器安裝（例如 [Podman](/zh-TW/install/podman)）不會將主機
    `~/.claude` 掛載到設定或執行階段；請在其中使用 Anthropic API 金鑰，或選擇
    具有 OpenClaw 管理的 OAuth 的提供者，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

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

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可基於
    相容性運作，但新的設定應將提供者/模型選擇維持為
    `anthropic/*`，並將執行後端放在提供者/模型執行階段政策中。

    ### 計費與 `claude -p`

    OpenClaw 會使用 Claude Code 的非互動式 `claude -p` 路徑執行 Claude 命令列介面
    作業。Anthropic 目前將該路徑視為 Agent SDK/程式化使用：

    - Anthropic 2026 年 6 月 15 日的支援更新暫停了先前宣布的
      獨立 Agent SDK 額度方案。
    - 訂閱方案的 Claude Agent SDK、`claude -p` 和第三方應用程式使用量
      仍會從已登入訂閱的使用量限制中扣除。
    - 先前宣布的每月 Agent SDK 額度在
      Anthropic 修訂該方案期間不可用。
    - Console/API 金鑰登入會使用隨用隨付 API 計費，且不會收到
      訂閱的 Agent SDK 額度。

    請參閱 Anthropic 的 [Agent SDK 方案
    文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    了解暫停通知，以及 Claude Code 方案文章中關於
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    和
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    訂閱行為的說明。

    Anthropic 可以在沒有 OpenClaw 發行版的情況下變更 Claude Code 計費和速率限制行為。
    當計費可預測性很重要時，請檢查 `claude auth status`、`/status`，
    以及 Anthropic 連結的文件。

    <Tip>
    對於共用的正式環境自動化，請使用 Anthropic API 金鑰，而不是
    Claude 命令列介面。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 和 [Z.AI / GLM](/zh-TW/providers/zai)
    的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 一律使用自適應思考，且預設為 `high`
投入程度。Anthropic 不允許停用此模型的思考，因此
`/think off` 和 `/think minimal` 會改對應到 `low` 投入程度。OpenClaw 也會
在 Fable 5 請求中省略自訂 temperature 值，因為 Anthropic 會拒絕
任何啟用思考請求上的 temperature 覆寫。

Claude Opus 4.8 在 OpenClaw 中預設保持關閉思考。當你明確使用
`/think high|xhigh|max` 啟用自適應思考時，OpenClaw 會傳送
Anthropic 的 Opus 4.8 投入程度值；Claude 4.6 模型（Opus 4.6 和 Sonnet 4.6）
預設為 `adaptive`。

可使用 `/think:<level>` 針對每則訊息覆寫，或在模型參數中設定：

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
使用 Claude Fable 5 表示也會使用 Claude Opus 4.8。Fable 5 隨附
可能拒絕請求的安全分類器，而 Anthropic 認可的
復原方式是由 `claude-opus-4-8` 服務該回合。OpenClaw 會為直接 API 金鑰請求
自動選擇加入此機制，因此某些 Fable 回合會由 Claude Opus 4.8 回答
並以 Claude Opus 4.8 計費。如果你的政策或預算無法接受
由 Opus 服務的回合，請不要選擇 `anthropic/claude-fable-5`。
</Warning>

### 為什麼存在此機制

Fable 5 分類器會在受限領域的請求上回傳 `stop_reason: "refusal"`，
而且也會對接近良性的工作誤判為陽性（安全
工具、生命科學，甚至要求模型重現其原始
推理）。如果沒有備援，該回合會以錯誤結束，即使
另一個 Claude 模型可以正常服務它 - Anthropic 自己的拒絕訊息
會告知 API 整合者設定備援模型。

### 運作方式

1. 對每個送往 `anthropic/claude-fable-5` 的直接 API 金鑰請求，OpenClaw
   會傳送 Anthropic 伺服器端備援選擇加入：包含
   `server-side-fallback-2026-06-01` beta 標頭和
   `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic
   允許 Fable 5 使用的唯一備援目標。
2. 只有安全分類器拒絕才會觸發備援。速率限制、
   過載和伺服器錯誤會完全維持原行為，並透過
   OpenClaw 一般的[模型容錯移轉](/zh-TW/concepts/model-failover)處理。
3. 救援會在同一次呼叫內發生。在任何輸出前拒絕時，
   除了延遲之外不會被察覺；完整答案會來自 Opus 4.8。若在
   串流中途拒絕，部分文字會保留作為備援
   模型接續的前綴，而被拒絕模型的推理和工具呼叫
   會依 Anthropic 的重播規則丟棄（不得回傳或
   執行）。
4. 如果 Claude Opus 4.8 也拒絕，該回合會將拒絕以
   錯誤呈現，與此功能之前完全相同。

備援會在 Anthropic API 層級發生，因此 `claude-opus-4-8` 不
需要出現在你設定的模型清單或備援鏈中 - 具備 Fable 能力的
API 金鑰一律可以服務 Opus。

### 可觀測性與計費

- 由備援服務的回合會在助理訊息上記錄 `provider_fallback` 診斷，
  命名 `fromModel` 和 `toModel`，且訊息的
  `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 依嘗試次數計費：輸出前的拒絕是免費的，而救援
  會以 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的
  每回合成本估算會以 Opus 費率計算由備援服務的回合以保持一致。
- 串流中途拒絕還會在 Anthropic 端計入已串流的 Fable 部分
  費用；該部分會在 API 的每次嘗試
  使用量中回報，但不會納入 OpenClaw 的每回合估算。

### 範圍

適用於使用 API 金鑰驗證並對 `api.anthropic.com` 發出的
`anthropic/claude-fable-5`。OAuth（Claude 命令列介面訂閱重用）、代理基底 URL、
Bedrock、Vertex 和 Foundry 請求不受影響，且在那些情況下仍會將
拒絕呈現為錯誤。

即時驗證：一個要求 Fable 5 重現其原始思維鏈的良性提示，在未傳送
備援時會以 `category: "reasoning_extraction"` 被拒絕，而同一提示透過 OpenClaw
會回傳由 Opus 服務的正常答案，並附上 `provider_fallback` 診斷。

請參閱 Anthropic 的[拒絕與備援
指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
了解底層行為。

## 提示快取

OpenClaw 支援 Anthropic 的提示快取功能，用於 API 金鑰驗證。

| 值                  | 快取期間 | 說明                                   |
| ------------------- | -------- | -------------------------------------- |
| `"short"`（預設）   | 5 分鐘   | 會自動套用於 API 金鑰驗證             |
| `"long"`            | 1 小時   | 延伸快取                               |
| `"none"`            | 不快取   | 停用提示快取                           |

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
  <Accordion title="Per-agent cache overrides">
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

    這讓一個代理可以保留長效快取，同時讓同一模型上的另一個代理針對突發性／低重用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 備註">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在已設定時接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型會在執行階段強制設為 `cacheRetention: "none"`。
    - 當未設定明確值時，API 金鑰智慧預設值也會為 Claude-on-Bedrock 參照預先填入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換會針對直連 `api.anthropic.com` 的 API 金鑰流量設定 Anthropic 的 `service_tier` 欄位。

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
    - 僅適用於使用 API 金鑰直接向 `api.anthropic.com` 發出的請求。OAuth／訂閱權杖請求與代理路由永遠不會取得 `service_tier` 欄位。
    - 當同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳戶上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建的 Anthropic 外掛會註冊圖片與 PDF 理解。OpenClaw
    會從已設定的 Anthropic 驗證自動解析媒體能力；不需要
    額外設定。

    | 屬性        | 值                 |
    | --------------- | --------------------- |
    | 預設模型   | `claude-opus-4-8`     |
    | 支援的輸入 | 圖片、PDF 文件 |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動
    將其路由到 Anthropic 媒體理解提供者。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Anthropic 的 1M 上下文視窗已在具備自適應
    thinking 的 Claude 4.x 模型上正式推出：Opus 4.8、Opus 4.7、Opus 4.6，以及 Sonnet 4.6。OpenClaw 會自動將這些
    模型調整為 1,048,576 個權杖，無需 `params.context1m`：

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

    較舊的設定可以保留 `params.context1m: true`；對於
    這些模型而言它是無害的空操作，而且 OpenClaw 不再傳送已淘汰的
    `context-1m-2025-08-07` beta 標頭。較舊的 `anthropicBeta` 設定
    項目若含有該值，會在請求標頭解析期間被捨棄，而
    不支援的較舊 Claude 模型會維持其正常的上下文視窗。

    對 Claude 命令列介面後端（`claude-cli/*`）而言，`params.context1m: true` 的行為
    也相同：符合 GA 能力的 Opus 與 Sonnet 模型已經會自動取得
    1M 視窗，因此該參數在那裡也是選用的。

    <Warning>
    需要你的 Anthropic 憑證具備長上下文存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic beta 標頭，但如果已淘汰的 1M beta 標頭仍存在於較舊設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗；不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然無效">
    Anthropic 權杖驗證會過期且可被撤銷。對於新設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**逐代理**設定；新代理不會繼承主要代理的金鑰。請為該代理重新執行導覽設定（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的憑證'>
    執行 `openclaw models status` 查看目前使用中的驗證設定檔。請重新執行導覽設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能以模型為範圍，因此同層的 Anthropic 模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting) 與 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關

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
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
