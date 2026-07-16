---
read_when:
    - 你正在安裝、設定或稽核 microsoft-foundry 外掛
summary: 為 OpenClaw 新增 Microsoft Foundry 模型提供者支援。
title: Microsoft Foundry 外掛
x-i18n:
    generated_at: "2026-07-16T11:52:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry 外掛

為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。

## 發佈

- 套件：`@openclaw/microsoft-foundry`
- 安裝方式：隨附於 OpenClaw

## 介面

供應商：`microsoft-foundry`；合約：`imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- 影像生成供應商：`microsoft-foundry`

## 需求

- 具有部署項目的 Microsoft Foundry 或 Azure AI Foundry 資源。
- 透過 `AZURE_OPENAI_API_KEY` 或已設定的供應商 API 金鑰進行 API 金鑰驗證。
- 若要使用 Entra ID 驗證，請安裝 Azure 命令列介面，並在
  初始設定前執行 `az login`。OpenClaw 會透過
  `az account get-access-token` 重新整理 Microsoft Foundry 執行階段權杖。

## 聊天模型

Microsoft Foundry 聊天部署使用供應商模型參照
`microsoft-foundry/<deployment-name>`。初始設定會使用 Azure 命令列介面探索 Foundry 資源
與部署項目，然後將所選的部署名稱寫入
模型設定。

OpenClaw 針對支援的 OpenAI 相容聊天 API 使用 Foundry
`/openai/v1` 端點：

- GPT、`o*`、`computer-use-preview` 和 DeepSeek-V4 模型系列預設使用
  `openai-responses`。
- 除非已明確設定支援的 API，否則 MAI-DS-R1 與其他聊天補全部署會使用
  `openai-completions`。
- MAI-DS-R1 會透過推理內容記錄為具備推理能力，而不是透過
  `reasoning_effort`。其上下文與輸出權杖中繼資料為
  163,840 個權杖。

Microsoft Foundry 中的 Anthropic Claude 部署使用 Anthropic Messages
API 格式，而非 OpenAI 相容的 `/openai/v1` 格式。在 Microsoft Foundry 外掛
加入原生 Anthropic 執行階段之前，請將這些部署設定為自訂
`anthropic-messages` 供應商。若 Foundry 部署名稱與
Claude 模型 ID 不同，請在模型項目上設定 `params.canonicalModelId`，讓 OpenClaw
能套用模型專屬的傳輸合約、正確對應 `/think off`，並
安全保留已簽署的思考內容。

## MAI 影像生成

此外掛會為 `image_generate` 註冊 `microsoft-foundry`，並支援目前的
Microsoft AI 影像模型：

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

請使用已部署的 MAI 影像部署名稱作為模型參照。此供應商不會
宣告預設影像模型，因為 MAI API 要求在請求的
`model` 欄位中提供你的部署名稱：

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

僅提示詞的生成會呼叫 Microsoft Foundry 的 MAI 生成端點：
`/mai/v1/images/generations`。參照影像編輯會呼叫
`/mai/v1/images/edits`，且僅限於 `MAI-Image-2.5-Flash` 與
`MAI-Image-2.5` 部署。

僅提示詞的生成只要設定 Foundry 端點，即可使用自訂部署名稱。若要使用
自訂部署名稱進行影像編輯，請透過初始設定選取
該部署，或加入模型中繼資料，讓 OpenClaw 能驗證
該部署是由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 提供支援。

MAI 影像限制：

- 輸出：每個請求產生一張 PNG 影像。
- 尺寸：預設為 `1024x1024`；寬度與高度皆須至少為 768 px。
- 總像素數：寬度 × 高度最多為 1,048,576。
- 編輯：一張 PNG 或 JPEG 輸入影像。
- 不會將 `aspectRatio`、`resolution`、`quality`、
  `background` 等不支援的共用提示，以及非 PNG 的 `outputFormat` 傳送至 Microsoft Foundry。

## 疑難排解

- `az: command not found`：安裝 Azure 命令列介面或使用 API 金鑰驗證。
- `Microsoft Foundry endpoint missing for MAI image generation`：透過初始設定選取
  Foundry 部署，或加入 `models.providers.microsoft-foundry.baseUrl`。
- `supports MAI image deployments only`：所選影像模型指向
  非 MAI 部署。請為 `image_generate` 使用已部署的 MAI 影像模型。

<!-- openclaw-plugin-reference:manual-end -->
