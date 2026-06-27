---
read_when:
    - 你想要搭配 OpenClaw 使用騰訊 Hy3 預覽版
    - 你需要 TokenHub API 金鑰設定
summary: 騰訊雲 TokenHub 的 Hy3 預覽版設定
title: 騰訊雲（TokenHub）
x-i18n:
    generated_at: "2026-06-27T19:57:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

安裝官方 Tencent Cloud 提供者外掛，透過 TokenHub 端點 (`tencent-tokenhub`) 使用 OpenAI 相容 API 存取 Tencent Hy3 預覽版。

| 屬性             | 值                                                    |
| ---------------- | ----------------------------------------------------- |
| 提供者 ID        | `tencent-tokenhub`                                    |
| 套件             | `@openclaw/tencent-provider`                          |
| 驗證環境變數     | `TOKENHUB_API_KEY`                                    |
| 入門設定旗標     | `--auth-choice tokenhub-api-key`                      |
| 直接命令列介面旗標 | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 相容 (`openai-completions`)                    |
| 預設基底 URL     | `https://tokenhub.tencentmaas.com/v1`                 |
| 全域基底 URL     | `https://tokenhub-intl.tencentmaas.com/v1`（覆寫）    |
| 預設模型         | `tencent-tokenhub/hy3-preview`                        |

## 快速開始

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="建立 TokenHub API 金鑰">
    在 Tencent Cloud TokenHub 中建立 API 金鑰。如果你為金鑰選擇有限存取範圍，請在允許的模型中包含 **Hy3 預覽版**。
  </Step>
  <Step title="執行入門設定">
    <CodeGroup>

```bash 入門設定
openclaw onboard --auth-choice tokenhub-api-key
```

```bash 直接旗標
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash 僅使用環境變數
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

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

## 內建目錄

| 模型參照                       | 名稱                   | 輸入 | 上下文  | 最大輸出 | 備註                     |
| ------------------------------ | ---------------------- | ---- | ------- | -------- | ------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 預覽版 (TokenHub)  | 文字 | 256,000 | 64,000   | 預設；已啟用推理能力     |

Hy3 預覽版是騰訊混元的大型 MoE 語言模型，適用於推理、長上下文指令遵循、程式碼與代理工作流程。Tencent 的 OpenAI 相容範例使用 `hy3-preview` 作為模型 ID，並支援標準 chat-completions 工具呼叫與 `reasoning_effort`。

<Tip>
  模型 ID 是 `hy3-preview`。不要將它與 Tencent 的 `HY-3D-*` 模型混淆；後者是 3D 生成 API，不是此提供者設定的 OpenClaw 聊天模型。
</Tip>

## 分級定價

提供者目錄隨附會依輸入視窗長度調整的分級成本中繼資料，因此無需手動覆寫即可填入成本估算。

| 輸入 token 範圍 | 輸入費率 | 輸出費率 | 快取讀取 |
| --------------- | -------- | -------- | -------- |
| 0 - 16,000      | 0.176    | 0.587    | 0.059    |
| 16,000 - 32,000 | 0.235    | 0.939    | 0.088    |
| 32,000+         | 0.293    | 1.173    | 0.117    |

費率依 Tencent 公告，以每百萬 token 的美元價格計算。只有在你需要不同介面時，才覆寫 `models.providers.tencent-tokenhub` 下的定價。

## 進階設定

<AccordionGroup>
  <Accordion title="端點覆寫">
    OpenClaw 預設使用 Tencent Cloud 的 `https://tokenhub.tencentmaas.com/v1` 端點。Tencent 也記載了一個國際 TokenHub 端點：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    只有在你的 TokenHub 帳戶或區域需要時，才覆寫端點。

  </Accordion>

  <Accordion title="守護程式的環境可用性">
    如果閘道以受管理服務執行（launchd、systemd、Docker），`TOKENHUB_API_KEY` 必須對該程序可見。請在 `~/.openclaw/.env` 中設定，或透過 `env.shellEnv` 設定，讓 launchd、systemd 或 Docker exec 環境可以讀取。

    <Warning>
      只在互動式 shell 中匯出的金鑰，受管理的閘道程序無法看見。請使用 env 檔案或設定接縫，以確保持久可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration" icon="gear">
    包含提供者設定的完整設定結構描述。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud 的 TokenHub 產品頁面。
  </Card>
  <Card title="Hy3 預覽版模型卡" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 預覽版詳細資訊與基準測試。
  </Card>
</CardGroup>
