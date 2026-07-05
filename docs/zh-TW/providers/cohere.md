---
read_when:
    - 你想搭配 OpenClaw 使用 Cohere
    - 你需要 Cohere API 金鑰環境變數或命令列介面驗證選項
summary: Cohere 設定（驗證 + 模型選擇）
title: Cohere
x-i18n:
    generated_at: "2026-07-05T11:36:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 846e69fd185c210c9ffd8719a233272aeda2aa0749f952a74714c13fd917fb66
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) 透過其 Compatibility API 提供與 OpenAI 相容的推論。OpenClaw 在外部化轉換期間內建 Cohere 供應商，也將其作為官方外部外掛發布。

| 屬性            | 值                                                   |
| --------------- | ---------------------------------------------------- |
| 供應商 ID       | `cohere`                                             |
| 外掛            | 轉換期間內建；官方外部套件                         |
| 驗證環境變數    | `COHERE_API_KEY`                                     |
| 入門設定旗標    | `--auth-choice cohere-api-key`                       |
| 直接命令列介面旗標 | `--cohere-api-key <key>`                          |
| API             | 與 OpenAI 相容 (`openai-completions`)                |
| 基底 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 預設模型        | `cohere/command-a-03-2025`                           |
| 上下文視窗      | 256,000 個 token                                     |

## 開始使用

1. Cohere 隨目前的 OpenClaw 套件一併提供。如果缺少它，請安裝外部套件並重新啟動閘道：

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. 建立 Cohere API 金鑰。
3. 執行入門設定：

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 確認目錄可用：

```bash
openclaw models list --provider cohere
```

只有在尚未設定主要模型時，入門設定才會將 Cohere 設為主要模型。

## 僅使用環境變數設定

讓 `COHERE_API_KEY` 可供閘道程序使用，然後選取 Cohere 模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
如果閘道以常駐程式或在 Docker 中執行，請為該服務設定 `COHERE_API_KEY`。只在互動式 shell 中匯出它，並不會讓已在執行的閘道能夠使用。
</Note>

## 相關內容

- [模型供應商](/zh-TW/concepts/model-providers)
- [模型命令列介面](/zh-TW/cli/models)
- [供應商目錄](/zh-TW/providers/index)
