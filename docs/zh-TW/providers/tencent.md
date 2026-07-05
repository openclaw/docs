---
read_when:
    - 你想搭配 OpenClaw 使用 Tencent Hy3 預覽版
    - 你需要設定 TokenHub API 金鑰
summary: 騰訊雲 TokenHub 的 Hy3 預覽設定
title: 騰訊雲端（TokenHub）
x-i18n:
    generated_at: "2026-07-05T11:43:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d9d0b046ba7f28035048f3b9cd42efa6c1bb7977c67e15fe4a957a8d2c5872c
    source_path: providers/tencent.md
    workflow: 16
---

安裝官方騰訊雲 provider 外掛，透過 TokenHub endpoint (`tencent-tokenhub`) 使用 OpenAI-compatible API 存取 Tencent Hy3 preview。

| 屬性            | 值                                       |
| --------------- | ---------------------------------------- |
| Provider id     | `tencent-tokenhub`                       |
| Package         | `@openclaw/tencent-provider`             |
| Auth env var    | `TOKENHUB_API_KEY`                       |
| Onboarding flag | `--auth-choice tokenhub-api-key`         |
| Direct CLI flag | `--tokenhub-api-key <key>`               |
| API             | OpenAI-compatible (`openai-completions`) |
| Base URL        | `https://tokenhub.tencentmaas.com/v1`    |
| Default model   | `tencent-tokenhub/hy3-preview`           |

## 快速開始

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    在騰訊雲 TokenHub 中建立 API key。如果你為該 key 選擇有限的存取範圍，請在允許的模型中包含 **Hy3 preview**。
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
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

<Note>
`--accept-risk` 必須與 `--non-interactive` 一起使用。
</Note>

## 內建型錄

| 模型參照                       | 名稱                   | 輸入 | 上下文  | 最大輸出 | 備註                       |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | 預設；已啟用推理 |

Hy3 preview 是騰訊混元的大型 MoE 語言模型，適用於推理、長上下文指令遵循、程式碼和代理工作流程。它支援標準 chat-completions 工具呼叫以及 `reasoning_effort`。

<Tip>
  模型 id 是 `hy3-preview`。請勿將它與騰訊的 `HY-3D-*` 模型混淆，後者是 3D 生成 API，並不是此 provider 設定的 OpenClaw chat model。
</Tip>

## 分級定價

provider 型錄隨附分級成本 metadata，會依輸入視窗長度調整，因此不需手動覆寫即可填入成本估算。

| 輸入 token 範圍 | 輸入費率 | 輸出費率 | 快取讀取 |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

費率以騰訊公告的每百萬 token 美元價格計算。只有在你需要不同介面時，才覆寫 `models.providers.tencent-tokenhub` 底下的定價。

## 進階設定

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw 的內建型錄使用騰訊雲的 `https://tokenhub.tencentmaas.com/v1` endpoint。只有在你的 TokenHub 帳號或區域需要不同 endpoint 時才覆寫：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    如果閘道作為受管理服務執行（launchd、systemd、Docker），`TOKENHUB_API_KEY` 必須對該程序可見。請在 `~/.openclaw/.env` 中設定，或透過 `env.shellEnv` 設定，讓 launchd、systemd 或 Docker exec 環境可以讀取。

    <Warning>
      只在互動式 shell 中 export 的 key 對受管理的閘道程序不可見。請使用 env 檔案或 config seam 以取得持久可用性。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 provider、模型參照與 failover 行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整 config schema，包含 provider 設定。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    騰訊雲的 TokenHub 產品頁面。
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    騰訊混元 Hy3 preview 詳細資訊與 benchmark。
  </Card>
</CardGroup>
