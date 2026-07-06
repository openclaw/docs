---
read_when:
    - 您想要搭配 OpenClaw 使用 LongCat-2.0
    - 你需要 LongCat API 金鑰或模型限制
summary: LongCat-2.0 的 LongCat API 設定
title: LongCat
x-i18n:
    generated_at: "2026-07-06T21:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) 提供 LongCat-2.0 的託管 API，這是一個
為程式開發與代理式工作負載打造的推理模型。OpenClaw 提供官方
`longcat` 外掛，用於 LongCat 的 OpenAI 相容端點。

| 屬性       | 值                                 |
| ---------- | ---------------------------------- |
| 供應商     | `longcat`                          |
| 驗證       | `LONGCAT_API_KEY`                  |
| API        | OpenAI 相容的 Chat Completions     |
| 基礎 URL   | `https://api.longcat.chat/openai`  |
| 模型       | `longcat/LongCat-2.0`              |
| 上下文     | 1,048,576 個 token                 |
| 最大輸出   | 131,072 個 token                   |
| 輸入       | 文字                               |

## 安裝外掛

安裝官方套件，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="Create an API key">
    登入 [LongCat API Platform](https://longcat.chat/platform/)，並在
    [API Keys](https://longcat.chat/platform/api_keys) 頁面建立金鑰。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

當尚未設定主要模型時，導覽設定會加入託管型目錄，並選取 `longcat/LongCat-2.0`。

### 非互動式設定

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## 推理行為

LongCat 提供二元思考控制。OpenClaw 會將啟用的思考層級對應到
`thinking: { type: "enabled" }`，並將 `/think off` 對應到
`thinking: { type: "disabled" }`。LongCat 目前未記錄
`reasoning_effort`，因此 OpenClaw 不會傳送它。

LongCat 會在 `reasoning_content` 中回傳推理內容。OpenClaw 在重播助理工具呼叫回合時會保留該欄位，讓多回合代理工作階段維持供應商預期的訊息形狀。

## 價格

內建目錄使用 LongCat 以百萬 token 為單位、以美元計價的隨用隨付定價：未快取輸入 $0.75、已快取輸入 $0.015、輸出 $2.95。LongCat 可能提供臨時折扣；[價格頁面](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
和你的帳單紀錄才是權威依據。

## 自行託管 LongCat-2.0

`longcat` 供應商目標是 LongCat 的託管 API。若要使用
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) 上的開放權重，請透過 OpenAI 相容執行階段提供模型，並改用 OpenClaw 現有的
[vLLM](/zh-TW/providers/vllm) 或 [SGLang](/zh-TW/providers/sglang) 供應商。

請在自行託管的供應商目錄中保留執行階段的確切模型識別碼；不要透過 `longcat/LongCat-2.0` 路由本機部署。

## 疑難排解

<AccordionGroup>
  <Accordion title="The key works in a shell but not in the Gateway">
    由守護程式管理的閘道程序不會繼承每個互動式 shell 變數。請將
    `LONGCAT_API_KEY` 放入 `~/.openclaw/.env`，透過導覽設定進行設定，或使用核准的密鑰參照。
  </Accordion>

  <Accordion title="Requests fail with 402 or 429">
    `402` 表示帳戶的 token 配額不足。`429` 表示 API 金鑰達到速率限制。請查看 [LongCat 用量](https://longcat.chat/platform/usage)，並在供應商的退避視窗後重試受速率限制的請求。
  </Accordion>

  <Accordion title="The model does not appear">
    執行 `openclaw plugins list` 並確認 `longcat` 外掛已啟用，然後執行 `openclaw models list --provider longcat`。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商設定、模型參照與容錯移轉行為。
  </Card>
  <Card title="LongCat API docs" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    託管 API 端點、驗證、限制與範例。
  </Card>
  <Card title="LongCat-2.0 model card" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    架構、部署指引與模型詳細資訊。
  </Card>
  <Card title="Secrets" href="/zh-TW/gateway/secrets" icon="key">
    儲存供應商憑證，而不在設定中嵌入純文字。
  </Card>
</CardGroup>
