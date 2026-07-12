---
read_when:
    - 你想要搭配 OpenClaw 使用 Meta
    - 你需要設定 `MODEL_API_KEY` 環境變數，或選擇命令列介面驗證方式
summary: Meta 設定（驗證 + 選擇 muse-spark-1.1 模型）
title: Meta
x-i18n:
    generated_at: "2026-07-12T14:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** 對 `muse-spark-1.1` 推理模型使用與 OpenAI 相容的 **Responses API**（`POST /v1/responses`）。此供應商以 OpenClaw 內建外掛的形式提供。

| 屬性              | 值                                 |
| ----------------- | ---------------------------------- |
| 供應商 ID         | `meta`                             |
| 外掛              | 內建供應商                         |
| 驗證環境變數      | `MODEL_API_KEY`                    |
| 初始設定旗標      | `--auth-choice meta-api-key`       |
| 直接命令列介面旗標 | `--meta-api-key <key>`             |
| API               | Responses API (`openai-responses`) |
| 基礎 URL          | `https://api.meta.ai/v1`           |
| 預設模型          | `meta/muse-spark-1.1`              |
| 預設推理強度      | `high` (`reasoning.effort`)        |

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider meta
    ```

    列出靜態的 `muse-spark-1.1` 目錄項目。如果無法解析 `MODEL_API_KEY`，
    `openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的認證資訊。

  </Step>
</Steps>

## 非互動式設定

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## 內建目錄

| 模型參照              | 名稱           | 推理能力 | 上下文視窗 | 最大輸出 |
| --------------------- | -------------- | -------- | ---------- | -------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | 是       | 1,048,576  | 131,072  |

功能：

- 文字與圖片輸入
- 工具呼叫與串流
- 推理強度：`minimal`、`low`、`medium`、`high`、`xhigh`（預設：`high`）
- 無狀態加密推理重播（`store: false`、`include: ["reasoning.encrypted_content"]`）

<Warning>
`muse-spark-1.1` 不接受 `reasoning.effort: "none"`。OpenClaw 會針對此供應商將
`--thinking off` 對應為 `minimal`。
</Warning>

## 手動設定

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
如果閘道以常駐程式（launchd、systemd、Docker）執行，請確認該程序可存取
`MODEL_API_KEY`，例如將其放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`
提供。僅在互動式 shell 中匯出的金鑰不會對受管理的服務生效，除非另外匯入該環境變數。
</Note>

## 冒煙測試

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

即時測試會使用 `muse-spark-1.1` 呼叫 `POST /v1/responses`。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    muse-spark-1.1 的推理強度等級。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設值與模型設定。
  </Card>
</CardGroup>
