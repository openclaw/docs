---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 透過 API 金鑰或 Claude 命令列介面在 OpenClaw 中使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:08:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型系列。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** — 直接存取 Anthropic API，並依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** — 在同一主機上重用現有的 Claude Code 登入

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動列印模式執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件將 `claude -p` 描述為 Agent SDK／程式化用法。Anthropic 於 2026 年 6 月 15 日的支援更新暫停了已公告的 Agent SDK 計費變更。目前 Anthropic 表示 Claude Agent SDK、`claude -p` 與第三方應用程式用量仍會計入訂閱的使用限制。在 Anthropic 修訂該方案期間，先前公告的每月 Agent SDK 額度不可用。

互動式 Claude Code 仍會計入已登入 Claude 方案的限制。API 金鑰驗證仍是直接的隨用隨付 API 計費。對於長期運作的閘道主機、共享自動化與可預測的正式環境支出，請使用 Anthropic API 金鑰。

在仰賴訂閱計費行為之前，請查看 Anthropic 目前的支援文章：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        在 [Anthropic Console](https://console.anthropic.com/) 建立 API 金鑰。
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
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
    **最適合：**在沒有個別 API 金鑰的情況下重用現有的 Claude 命令列介面登入。

    <Steps>
      <Step title="確認 Claude 命令列介面已安裝且已登入">
        使用下列命令確認：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用現有的 Claude 命令列介面認證。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude 命令列介面後端的設定與執行階段詳細資訊位於[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude 命令列介面重用預期 OpenClaw 程序與 Claude 命令列介面登入在同一主機上執行。Docker 安裝可以保留容器主目錄並在其中登入 Claude Code；請參閱
    [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。
    其他容器安裝（例如 [Podman](/zh-TW/install/podman)）不會將主機的
    `~/.claude` 掛載到設定或執行階段；請在那裡使用 Anthropic API 金鑰，或選擇具有 OpenClaw 管理 OAuth 的供應商，例如
    [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 設定範例

    偏好使用標準 Anthropic 模型參照，並加上命令列介面執行階段覆寫：

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

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可基於相容性運作，但新的設定應將供應商／模型選擇保持為 `anthropic/*`，並將執行後端放在供應商／模型執行階段政策中。

    ### 計費與 `claude -p`

    OpenClaw 會使用 Claude Code 的非互動式 `claude -p` 路徑來執行 Claude 命令列介面。Anthropic 目前將該路徑視為 Agent SDK／程式化用法：

    - Anthropic 於 2026 年 6 月 15 日的支援更新暫停了先前公告的個別 Agent SDK 額度方案。
    - 目前，訂閱方案的 Claude Agent SDK、`claude -p` 與第三方應用程式用量仍會計入已登入訂閱的使用限制。
    - 在 Anthropic 修訂該方案期間，先前公告的每月 Agent SDK 額度不可用。
    - Console／API 金鑰登入使用隨用隨付 API 計費，且不會取得訂閱的 Agent SDK 額度。

    請參閱 Anthropic 的 [Agent SDK 方案文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)以了解暫停通知，並參閱 Claude Code 方案文章以了解
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    與
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    訂閱行為。

    Anthropic 可以在沒有 OpenClaw 發版的情況下變更 Claude Code 計費與速率限制行為。當計費可預測性很重要時，請查看 `claude auth status`、`/status` 與 Anthropic 連結的文件。

    <Tip>
    對於共享正式環境自動化，請使用 Anthropic API 金鑰，而非 Claude 命令列介面。OpenClaw 也支援來自
    [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax) 與 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude Fable 5、4.8 與 4.6）

`anthropic/claude-fable-5` 一律使用自適應思考，並預設為 `high` 努力程度。由於 Anthropic 不允許停用此模型的思考，`/think off` 與 `/think minimal` 會使用 `low` 努力程度。OpenClaw 也會在 Fable 5 請求中省略自訂 temperature 值。

Claude Opus 4.8 在 OpenClaw 中預設關閉思考。當你使用 `/think high|xhigh|max` 明確啟用自適應思考時，OpenClaw 會傳送 Anthropic 的 Opus 4.8 努力程度值；Claude 4.6 模型預設為 `adaptive`。

可使用 `/think:<level>` 針對每則訊息覆寫，或在模型參數中覆寫：

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

## 安全拒絕後援（Claude Fable 5）

<Warning>
使用 Claude Fable 5 也表示會使用 Claude Opus 4.8。Fable 5 隨附的安全分類器可能會拒絕請求，而 Anthropic 核准的復原方式是由 `claude-opus-4-8` 服務該回合。OpenClaw 會針對直接 API 金鑰請求自動選用此機制，因此某些 Fable 回合會由 Claude Opus 4.8 回答並計費。如果你的政策或預算無法接受由 Opus 服務的回合，請不要選擇 `anthropic/claude-fable-5`。
</Warning>

### 為什麼需要這項功能

Fable 5 分類器會對受限領域中的請求回傳 `stop_reason: "refusal"`，也會對接近良性的工作產生誤判（安全工具、生命科學，甚至要求模型重現其原始推理）。如果沒有後援，該回合會以錯誤結束，即使另一個 Claude 模型可以正常服務；Anthropic 自己的拒絕訊息會告知 API 整合者設定後援模型。

### 運作方式

1. 對每個傳送至 `anthropic/claude-fable-5` 的直接 API 金鑰請求，OpenClaw 會傳送 Anthropic 的伺服器端後援選用設定：`server-side-fallback-2026-06-01` beta 標頭加上 `fallbacks: [{"model": "claude-opus-4-8"}]`。Claude Opus 4.8 是 Anthropic 允許 Fable 5 使用的唯一後援目標。
2. 只有安全分類器拒絕才會觸發後援。速率限制、過載與伺服器錯誤的行為會與之前完全相同，並走 OpenClaw 一般的[模型容錯移轉](/zh-TW/concepts/model-failover)。
3. 救援會在同一次呼叫內發生。在任何輸出前的拒絕除了延遲外不可見；整個答案都來自 Opus 4.8。若在串流中途拒絕，部分文字會保留為後援模型接續的前綴，而遭拒模型的推理與工具呼叫會依 Anthropic 的重播規則丟棄（不得回傳或執行）。
4. 如果 Claude Opus 4.8 也拒絕，該回合會將拒絕以錯誤形式呈現，與此功能之前完全相同。

後援發生在 Anthropic API 層級，因此 `claude-opus-4-8` 不需要出現在你設定的模型清單或後援鏈中；具備 Fable 能力的 API 金鑰一律可以服務 Opus。

### 可觀測性與計費

- 由後援服務的回合會在助理訊息上記錄一個 `provider_fallback` 診斷，命名 `fromModel` 與 `toModel`，且訊息的 `responseModel` 會回報 `claude-opus-4-8`。
- Anthropic 依嘗試次數計費：輸出前的拒絕免費，救援會依 Claude Opus 4.8 費率計費（目前為 Fable 5 費率的一半）。OpenClaw 的每回合成本估算會以 Opus 費率計價由後援服務的回合，以保持一致。
- 串流中途拒絕還會在 Anthropic 端計費已串流的 Fable 部分；該部分會在 API 的每次嘗試用量中回報，但不會納入 OpenClaw 的每回合估算。

### 範圍

適用於使用 API 金鑰驗證並連線至 `api.anthropic.com` 的 `anthropic/claude-fable-5`。OAuth（Claude 命令列介面訂閱重用）、代理基底 URL、Bedrock、Vertex 與 Foundry 請求未變更，並且在那裡仍會將拒絕呈現為錯誤。

即時驗證：一個要求 Fable 5 重現其原始思維鏈的良性提示，在未傳送後援時會以 `category: "reasoning_extraction"` 被拒絕；同一個提示透過 OpenClaw 會回傳由 Opus 服務的正常答案，並附上 `provider_fallback` 診斷。

請參閱 Anthropic 的[拒絕與後援指南](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)，了解底層行為。

## 提示快取

OpenClaw 支援 Anthropic 的提示快取功能，用於 API 金鑰驗證。

| 值                  | 快取期間 | 說明                                   |
| ------------------- | -------- | -------------------------------------- |
| `"short"`（預設）   | 5 分鐘   | 自動套用於 API 金鑰驗證               |
| `"long"`            | 1 小時   | 延長快取                               |
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
  <Accordion title="每個 agent 的快取覆寫">
    使用模型層級參數作為基準，然後透過 `agents.list[].params` 覆寫特定 agent：

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

    這讓一個代理能保留長期快取，而同一個模型上的另一個代理可針對突發且低重用率的流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後可接受 `cacheRetention` 傳遞。
    - 非 Anthropic 的 Bedrock 模型會在執行階段強制設為 `cacheRetention: "none"`。
    - 未明確設定值時，API 金鑰智慧預設也會為 Bedrock 上的 Claude 參照植入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換支援直接 Anthropic 流量（以 API 金鑰和 OAuth 連到 `api.anthropic.com`）。

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
    - 只會注入到直接 `api.anthropic.com` 請求。代理路由會保留 `service_tier` 不變。
    - 同時設定時，明確的 `serviceTier` 或 `service_tier` 參數會覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳號上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建的 Anthropic 外掛會註冊圖片與 PDF 理解能力。OpenClaw
    會從已設定的 Anthropic 驗證自動解析媒體能力，不需要
    額外設定。

    | 屬性        | 值                 |
    | --------------- | --------------------- |
    | 預設模型   | `claude-opus-4-8`     |
    | 支援輸入 | 圖片、PDF 文件 |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動
    將其路由到 Anthropic 媒體理解提供者。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Anthropic 的 1M 上下文視窗可用於支援 GA 的 Claude 4.x 模型，
    例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動將這些模型
    設為 1M：

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

    較舊設定可以保留 `params.context1m: true`，但 OpenClaw 不再傳送
    已退役的 `context-1m-2025-08-07` beta 標頭。較舊的 `anthropicBeta` 設定
    項目若含有該值，會在請求標頭解析期間被忽略，且
    不受支援的較舊 Claude 模型會維持其一般上下文視窗。

    `params.context1m: true` 也適用於符合資格且支援 GA 的 Opus 與 Sonnet 模型的 Claude CLI 後端
    （`claude-cli/*`），保留
    這些命令列介面工作階段的執行階段上下文視窗，以符合直接 API
    行為。

    <Warning>
    需要你的 Anthropic 憑證具備長上下文存取權。OAuth／訂閱權杖驗證會保留其所需的 Anthropic beta 標頭，但如果已退役的 1M beta 標頭仍留在較舊設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然無效">
    Anthropic 權杖驗證會過期，也可能被撤銷。新設定請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**依代理個別設定**，新代理不會繼承主要代理的金鑰。請為該代理重新執行上線流程（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的憑證'>
    執行 `openclaw models status` 以查看目前使用中的驗證設定檔。重新執行上線流程，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能限定於模型範圍，因此同層的 Anthropic 模型可能仍可使用。新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude CLI 後端設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨提供者運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
