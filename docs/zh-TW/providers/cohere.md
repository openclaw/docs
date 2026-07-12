---
read_when:
    - 你想搭配 OpenClaw 使用 Cohere
    - 你需要設定 Cohere API 金鑰環境變數，或選擇命令列介面驗證方式
summary: Cohere 設定（驗證 + 模型選擇）
title: Cohere
x-i18n:
    generated_at: "2026-07-11T21:44:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) 透過其相容性 API 提供與 OpenAI 相容的推論服務。OpenClaw 在 Cohere 提供者外部化的過渡期間將其內建於套件中，同時也將其發布為官方外部外掛。

| 屬性            | 值                                           |
| --------------- | -------------------------------------------- |
| 提供者 ID       | `cohere`                                     |
| 外掛            | 過渡期間內建；官方外部套件                   |
| 驗證環境變數    | `COHERE_API_KEY`                             |
| 初始設定旗標    | `--auth-choice cohere-api-key`               |
| 直接命令列旗標  | `--cohere-api-key <key>`                     |
| API             | 與 OpenAI 相容（`openai-completions`）       |
| 基礎 URL        | `https://api.cohere.ai/compatibility/v1`     |
| 預設模型        | `cohere/command-a-plus-05-2026`              |
| 上下文視窗      | 128,000 個權杖                               |

## 內建目錄

| 模型參照                             | 輸入         | 上下文  | 最大輸出 | 備註                               |
| ------------------------------------ | ------------ | ------- | -------- | ---------------------------------- |
| `cohere/command-a-plus-05-2026`      | 文字、圖片   | 128,000 | 64,000   | 預設；旗艦代理式推理模型           |
| `cohere/command-a-03-2025`           | 文字         | 256,000 | 8,000    | 上一代 Command A 模型              |
| `cohere/command-a-reasoning-08-2025` | 文字         | 256,000 | 32,000   | 代理式推理與工具使用               |
| `cohere/command-a-vision-07-2025`    | 文字、圖片   | 128,000 | 8,000    | 視覺與文件分析；不支援工具使用     |
| `cohere/north-mini-code-1-0`         | 文字、圖片   | 256,000 | 64,000   | 代理式程式開發；推理；免費額度     |

具備推理能力的 Cohere 模型支援兩種相容性 API 推理模式。OpenClaw 將 **關閉** 對應至 `none`，並將所有啟用的思考層級對應至 `high`。Command A Vision 不支援工具使用，因此 OpenClaw 會停用該模型的代理工具。

## 開始使用

1. 目前的 OpenClaw 套件已內建 Cohere。如果缺少此提供者，請安裝外部套件並重新啟動閘道：

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. 建立 Cohere API 金鑰。
3. 執行初始設定：

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 確認目錄可用：

```bash
openclaw models list --provider cohere
```

只有在尚未設定主要模型時，初始設定才會將 Cohere 設為主要模型。

## 僅使用環境變數設定

讓閘道程序可存取 `COHERE_API_KEY`，然後選取 Cohere 模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
如果閘道以常駐程式或在 Docker 中執行，請為該服務設定 `COHERE_API_KEY`。僅在互動式殼層中匯出此變數，無法讓已在執行中的閘道存取它。
</Note>

## 相關內容

- [模型提供者](/zh-TW/concepts/model-providers)
- [模型命令列介面](/zh-TW/cli/models)
- [提供者目錄](/zh-TW/providers/index)
