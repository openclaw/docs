---
read_when:
    - 你正在安裝、設定或稽核 microsoft-foundry 外掛
summary: 為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。
title: Microsoft Foundry 外掛
x-i18n:
    generated_at: "2026-07-11T21:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry 外掛

為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。

## 發行方式

- 套件：`@openclaw/microsoft-foundry`
- 安裝途徑：已包含於 OpenClaw

## 介面

供應商：microsoft-foundry；合約：imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 圖像生成供應商：`microsoft-foundry`

## 需求

- 具有部署的 Microsoft Foundry 或 Azure AI Foundry 資源。
- 透過 `AZURE_OPENAI_API_KEY` 或已設定的供應商 API 金鑰進行 API 金鑰驗證。
- 若使用 Entra ID 驗證，請安裝 Azure 命令列介面，並在引導設定前執行 `az login`。OpenClaw 會透過 `az account get-access-token` 重新整理 Microsoft Foundry 執行階段權杖。

## 聊天模型

Microsoft Foundry 聊天部署使用供應商模型參照 `microsoft-foundry/<deployment-name>`。引導設定會透過 Azure 命令列介面探索 Foundry 資源與部署，接著將所選的部署名稱寫入模型設定。

OpenClaw 對支援的 OpenAI 相容聊天 API 使用 Foundry `/openai/v1` 端點：

- GPT、`o*`、`computer-use-preview` 和 DeepSeek-V4 模型系列預設使用 `openai-responses`。
- MAI-DS-R1 與其他聊天補全部署使用 `openai-completions`，除非已明確設定受支援的 API。
- MAI-DS-R1 會透過推理內容記錄為具備推理能力，而非透過 `reasoning_effort`。其上下文與輸出權杖中繼資料皆為 163,840 個權杖。

Microsoft Foundry 中的 Anthropic Claude 部署使用 Anthropic Messages API 格式，而非 OpenAI 相容的 `/openai/v1` 格式。在 Microsoft Foundry 外掛新增原生 Anthropic 執行階段前，請將其設定為自訂 `anthropic-messages` 供應商。若 Foundry 部署名稱與 Claude 模型 ID 不同，請在模型項目上設定 `params.canonicalModelId`，讓 OpenClaw 能套用模型專屬的傳輸合約、正確對應 `/think off`，並安全保留已簽署的思考內容。

## MAI 圖像生成

此外掛會為 `image_generate` 註冊 `microsoft-foundry`，並支援目前的 Microsoft AI 圖像模型：

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

請使用已部署的 MAI 圖像部署名稱作為模型參照。此供應商不宣告預設圖像模型，因為 MAI API 要求在請求的 `model` 欄位中使用您的部署名稱：

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

僅含提示詞的生成會呼叫 Microsoft Foundry 的 MAI 生成端點：`/mai/v1/images/generations`。參考圖像編輯會呼叫 `/mai/v1/images/edits`，且僅限於 `MAI-Image-2.5-Flash` 與 `MAI-Image-2.5` 部署。

只要設定 Foundry 端點，僅含提示詞的生成即可使用自訂部署名稱。若要使用自訂部署名稱進行圖像編輯，請透過引導設定選取部署，或加入模型中繼資料，讓 OpenClaw 能驗證該部署是由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 支援。

MAI 圖像限制：

- 輸出：每個請求一張 PNG 圖像。
- 尺寸：預設為 `1024x1024`；寬度與高度皆不得小於 768 px。
- 總像素數：寬度 × 高度不得超過 1,048,576。
- 編輯：一張 PNG 或 JPEG 輸入圖像。
- 不支援的共用提示，例如 `aspectRatio`、`resolution`、`quality`、`background`，以及非 PNG 的 `outputFormat`，不會傳送至 Microsoft Foundry。

## 疑難排解

- `az: command not found`：安裝 Azure 命令列介面，或使用 API 金鑰驗證。
- `Microsoft Foundry endpoint missing for MAI image generation`：透過引導設定選取 Foundry 部署，或新增 `models.providers.microsoft-foundry.baseUrl`。
- `supports MAI image deployments only`：所選的圖像模型指向非 MAI 部署。請為 `image_generate` 使用已部署的 MAI 圖像模型。

<!-- openclaw-plugin-reference:manual-end -->
