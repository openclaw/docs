---
read_when:
    - 你正在安裝、設定或稽核 microsoft-foundry 外掛
summary: 為 OpenClaw 新增 Microsoft Foundry 模型提供者支援。
title: Microsoft Foundry 外掛
x-i18n:
    generated_at: "2026-06-27T19:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry 外掛

為 OpenClaw 新增 Microsoft Foundry 模型提供者支援。

## 發佈

- 套件：`@openclaw/microsoft-foundry`
- 安裝路徑：包含於 OpenClaw

## 介面

providers: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 影像生成提供者：`microsoft-foundry`

## 需求

- 具有部署的 Microsoft Foundry 或 Azure AI Foundry 資源。
- 透過 `AZURE_OPENAI_API_KEY` 或已設定的提供者 API 金鑰進行 API 金鑰驗證。
- 若要使用 Entra ID 驗證，請安裝 Azure 命令列介面並在入門設定前執行 `az login`。OpenClaw 會透過 `az account get-access-token` 重新整理 Microsoft Foundry 執行階段權杖。

## 聊天模型

Microsoft Foundry 聊天部署使用提供者模型參照 `microsoft-foundry/<deployment-name>`。入門設定會使用 Azure 命令列介面探索 Foundry 資源和部署，然後將選取的部署名稱寫入模型設定。

OpenClaw 會將 Foundry `/openai/v1` 端點用於支援的 OpenAI 相容聊天 API：

- GPT、`o*`、`computer-use-preview` 和 DeepSeek-V4 模型系列預設使用 `openai-responses`。
- MAI-DS-R1 和其他聊天補全部署會使用 `openai-completions`，除非設定了明確支援的 API。
- MAI-DS-R1 會透過推理內容記錄為具備推理能力，而不是透過 `reasoning_effort`。其內容和輸出權杖中繼資料為 163,840 個權杖。

Microsoft Foundry 中的 Anthropic Claude 部署使用 Anthropic Messages API 形狀，而不是 OpenAI 相容的 `/openai/v1` 形狀。請將這些部署設定為自訂 `anthropic-messages` 提供者，直到 Microsoft Foundry 外掛增加原生 Anthropic 執行階段為止。當 Foundry 部署名稱不同於 Claude 模型 ID 時，請在模型項目上設定 `params.canonicalModelId`，讓 OpenClaw 可以套用模型特定的傳輸合約、正確對應 `/think off`，並安全保留已簽署思考。

## MAI 影像生成

此外掛會針對 `image_generate` 註冊 `microsoft-foundry`，並支援目前的 Microsoft AI 影像模型：

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

請使用已部署的 MAI 影像部署名稱作為模型參照。提供者不宣告預設影像模型，因為 MAI API 要求在請求的 `model` 欄位中提供你的部署名稱：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

僅提示詞生成會呼叫 Microsoft Foundry 的 MAI 生成端點：`/mai/v1/images/generations`。參考影像編輯會呼叫 `/mai/v1/images/edits`，且僅限於 `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署。

僅提示詞生成可使用自訂部署名稱，只要已設定 Foundry 端點即可。若要使用自訂部署名稱進行影像編輯，請透過入門設定選取部署，或加入模型中繼資料，讓 OpenClaw 可以驗證該部署是由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 支援。

MAI 影像限制：

- 輸出：每個請求一張 PNG 影像。
- 大小：預設 `1024x1024`；寬度和高度都必須至少為 768 px。
- 總像素：寬度 × 高度最多必須為 1,048,576。
- 編輯：一張 PNG 或 JPEG 輸入影像。
- 不支援的共用提示，例如 `aspectRatio`、`resolution`、`quality`、`background` 和非 PNG 的 `outputFormat`，不會傳送至 Microsoft Foundry。

## 疑難排解

- `az: command not found`：安裝 Azure 命令列介面或使用 API 金鑰驗證。
- `Microsoft Foundry endpoint missing for MAI image generation`：透過入門設定選取 Foundry 部署，或加入 `models.providers.microsoft-foundry.baseUrl`。
- `supports MAI image deployments only`：選取的影像模型指向非 MAI 部署。請使用已部署的 MAI 影像模型進行 `image_generate`。

<!-- openclaw-plugin-reference:manual-end -->
