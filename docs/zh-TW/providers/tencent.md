---
read_when:
    - 你想要搭配 OpenClaw 使用騰訊 Hy3 預覽版
    - 您需要設定 TokenHub API 金鑰
summary: 騰訊雲 TokenHub 的 Hy3 預覽版設定
title: 騰訊雲 (TokenHub)
x-i18n:
    generated_at: "2026-04-30T03:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 16
---

# Tencent Cloud TokenHub

Tencent Cloud 在 OpenClaw 中以**內建 provider plugin**形式提供。它可透過 TokenHub endpoint (`tencent-tokenhub`) 存取 Tencent Hy3 preview。

此 provider 使用 OpenAI 相容 API。

| 屬性          | 值                                         |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| 預設模型      | `tencent-tokenhub/hy3-preview`             |
| 驗證          | `TOKENHUB_API_KEY`                         |
| API           | OpenAI 相容 chat completions               |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Global URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## 快速開始

<Steps>
  <Step title="建立 TokenHub API key">
    在 Tencent Cloud TokenHub 中建立 API key。如果你為該 key 選擇有限的存取範圍，請在允許的模型中包含 **Hy3 preview**。
  </Step>
  <Step title="執行 onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="驗證模型">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 非互動式設定

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 內建 catalog

| 模型 ref                       | 名稱                   | 輸入 | Context | 最大輸出   | 備註                       |
| ------------------------------ | ---------------------- | ---- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text | 256,000 | 64,000     | 預設；支援推理             |

Hy3 preview 是 Tencent Hunyuan 用於推理、長 context 指令遵循、程式碼與 agent 工作流程的大型 MoE 語言模型。Tencent 的 OpenAI 相容範例使用 `hy3-preview` 作為 model id，並支援標準 chat-completions tool calling 以及 `reasoning_effort`。

<Tip>
model id 是 `hy3-preview`。不要將它與 Tencent 的 `HY-3D-*` 模型混淆；後者是 3D 生成 API，並不是此 provider 設定的 OpenClaw chat model。
</Tip>

## Endpoint 覆寫

OpenClaw 預設使用 Tencent Cloud 的 `https://tokenhub.tencentmaas.com/v1` endpoint。Tencent 也記錄了一個國際 TokenHub endpoint：

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

只有在你的 TokenHub 帳戶或區域要求時，才覆寫 endpoint。

## 備註

- TokenHub model refs 使用 `tencent-tokenhub/<modelId>`。
- 內建 catalog 目前包含 `hy3-preview`。
- 此 plugin 將 Hy3 preview 標記為具備推理能力並支援 streaming-usage。
- 此 plugin 隨附分級 Hy3 pricing metadata，因此不需手動 pricing overrides 即可填入成本估算。
- 只有在需要時，才於 `models.providers` 中覆寫 pricing、context 或 endpoint metadata。

## 環境注意事項

如果 Gateway 以 daemon (launchd/systemd) 執行，請確保 `TOKENHUB_API_KEY`
可供該程序使用（例如放在 `~/.openclaw/.env`，或透過
`env.shellEnv`）。

## 相關文件

- [OpenClaw 設定](/zh-TW/gateway/configuration)
- [模型 Provider](/zh-TW/concepts/model-providers)
- [Tencent TokenHub 產品頁面](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub 文字生成](https://cloud.tencent.com/document/product/1823/130079)
- [Tencent TokenHub Cline setup for Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview model card](https://huggingface.co/tencent/Hy3-preview)
