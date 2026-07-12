---
read_when:
    - 您想搭配 OpenClaw 使用騰訊 hy3
    - 你需要設定 TokenHub 或 TokenPlan API 金鑰
summary: 為 hy3 設定騰訊雲 TokenHub 與 TokenPlan
title: 騰訊雲（TokenHub / TokenPlan）
x-i18n:
    generated_at: "2026-07-11T21:44:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

安裝官方騰訊雲提供者外掛，透過兩個端點——TokenHub（`tencent-tokenhub`）和 TokenPlan（`tencent-tokenplan`）——使用 OpenAI 相容 API 存取騰訊 Hy3。

| 屬性                      | 值                                                    |
| ------------------------- | ----------------------------------------------------- |
| 提供者 ID                 | `tencent-tokenhub`、`tencent-tokenplan`               |
| 套件                      | `@openclaw/tencent-provider`                          |
| TokenHub 驗證環境變數     | `TOKENHUB_API_KEY`                                    |
| TokenPlan 驗證環境變數    | `TOKENPLAN_API_KEY`                                   |
| TokenHub 初始設定旗標     | `--auth-choice tokenhub-api-key`                      |
| TokenPlan 初始設定旗標    | `--auth-choice tokenplan-api-key`                     |
| TokenHub 直接命令列旗標   | `--tokenhub-api-key <key>`                            |
| TokenPlan 直接命令列旗標  | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI 相容（`openai-completions`）                   |
| TokenHub 基礎 URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub 全球基礎 URL     | `https://tokenhub-intl.tencentmaas.com/v1`（覆寫）    |
| TokenPlan 基礎 URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| 預設模型                  | `tencent-tokenhub/hy3`                                |

## 快速開始

<Steps>
  <Step title="建立騰訊 API 金鑰">
    為騰訊雲 TokenHub 和 TokenPlan 建立 API 金鑰。如果您為金鑰選擇受限的存取範圍，請將 **hy3** 納入允許的模型；若打算在 TokenHub 上使用 **hy3 preview**，也請將其納入。
  </Step>
  <Step title="執行初始設定">
    <CodeGroup>

```bash TokenHub 初始設定
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub 直接旗標
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan 初始設定
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan 直接旗標
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash 僅使用環境變數
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="驗證模型">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## 非互動式設定

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
使用 `--non-interactive` 時，也必須加上 `--accept-risk`。
</Note>

## 內建目錄

| 模型參照                       | 名稱                    | 輸入 | 上下文  | 最大輸出 | 備註       |
| ------------------------------ | ----------------------- | ---- | ------- | -------- | ---------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview（TokenHub） | 文字 | 256,000 | 64,000   | 支援推理   |
| `tencent-tokenhub/hy3`         | hy3（TokenHub）         | 文字 | 256,000 | 64,000   | 支援推理   |
| `tencent-tokenplan/hy3`        | hy3（TokenPlan）        | 文字 | 256,000 | 64,000   | 支援推理   |

hy3 是騰訊混元的大型 MoE 語言模型，適用於推理、長上下文指令遵循、程式碼及代理工作流程。騰訊的 OpenAI 相容範例使用 `hy3` 作為模型 ID，並支援標準聊天補全工具呼叫及 `reasoning_effort`。

<Tip>
  模型 ID 是 `hy3`。請勿與騰訊的 `HY-3D-*` 模型混淆；後者是 3D 生成 API，並非此提供者設定的 OpenClaw 聊天模型。
</Tip>

## 進階設定

<AccordionGroup>
  <Accordion title="覆寫端點">
    OpenClaw 的內建目錄使用騰訊雲的 `https://tokenhub.tencentmaas.com/v1` 端點。只有在您的 TokenHub 帳戶或區域需要不同端點時才應覆寫：

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="常駐程式的環境變數可用性">
    如果閘道以受管理的服務執行（launchd、systemd、Docker），該程序必須能存取 `TOKENHUB_API_KEY` 和 `TOKENPLAN_API_KEY`。請在 `~/.openclaw/.env` 中設定，或透過 `env.shellEnv` 設定，以便 launchd、systemd 或 Docker exec 環境讀取。

    <Warning>
      僅在互動式 shell 中匯出的金鑰，受管理的閘道程序無法存取。請使用環境變數檔案或設定介面，以確保持續可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包括提供者設定。
  </Card>
  <Card title="騰訊 TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    騰訊雲的 TokenHub 產品頁面。
  </Card>
  <Card title="Hy3 preview 模型卡" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    騰訊混元 Hy3 preview 的詳細資訊與基準測試。
  </Card>
</CardGroup>
