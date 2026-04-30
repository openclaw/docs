---
read_when:
    - 你想在 OpenClaw 中使用 Xiaomi MiMo 模型
    - 你需要設定 XIAOMI_API_KEY
summary: 搭配 OpenClaw 使用 Xiaomi MiMo 模型
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-30T03:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 使用 Xiaomi 的
OpenAI 相容端點，並採用 API 金鑰驗證。

| 屬性     | 值                              |
| -------- | ------------------------------- |
| 提供者   | `xiaomi`                        |
| 驗證     | `XIAOMI_API_KEY`                |
| API      | OpenAI 相容                     |
| 基礎 URL | `https://api.xiaomimimo.com/v1` |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys) 建立 API 金鑰。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    或直接傳入金鑰：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 內建目錄

| 模型參照               | 輸入       | 脈絡      | 最大輸出   | 推理      | 備註     |
| ---------------------- | ---------- | --------- | ---------- | --------- | -------- |
| `xiaomi/mimo-v2-flash` | 文字       | 262,144   | 8,192      | 否        | 預設模型 |
| `xiaomi/mimo-v2-pro`   | 文字       | 1,048,576 | 32,000     | 是        | 大型脈絡 |
| `xiaomi/mimo-v2-omni`  | 文字、圖像 | 262,144   | 32,000     | 是        | 多模態   |

<Tip>
預設模型參照為 `xiaomi/mimo-v2-flash`。當設定了 `XIAOMI_API_KEY` 或存在驗證設定檔時，提供者會自動注入。
</Tip>

## 文字轉語音

隨附的 `xiaomi` Plugin 也會將 Xiaomi MiMo 註冊為 `messages.tts` 的語音提供者。
它會呼叫 Xiaomi 的聊天補全 TTS 合約，以文字作為 `assistant` 訊息，並將選用的風格指引作為 `user` 訊息。

| 屬性   | 值                                       |
| ------ | ---------------------------------------- |
| TTS ID | `xiaomi`（`mimo` 別名）                  |
| 驗證   | `XIAOMI_API_KEY`                         |
| API    | `POST /v1/chat/completions` 搭配 `audio` |
| 預設   | `mimo-v2.5-tts`，語音 `mimo_default`     |
| 輸出   | 預設為 MP3；設定後可為 WAV              |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

支援的內建語音包括 `mimo_default`、`default_zh`、`default_en`、
`Mia`、`Chloe`、`Milo` 和 `Dean`。`mimo-v2-tts` 支援較舊的 MiMo
TTS 帳戶；預設使用目前的 MiMo-V2.5 TTS 模型。對於 Feishu 和 Telegram
等語音訊息目標，OpenClaw 會在傳送前使用 `ffmpeg` 將 Xiaomi 輸出轉碼為 48kHz
Opus。

## 設定範例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="自動注入行為">
    當你的環境中設定了 `XIAOMI_API_KEY` 或存在驗證設定檔時，`xiaomi` 提供者會自動注入。除非你想覆寫模型中繼資料或基礎 URL，否則不需要手動設定提供者。
  </Accordion>

  <Accordion title="模型詳細資訊">
    - **mimo-v2-flash** — 輕量且快速，適合一般用途文字任務。不支援推理。
    - **mimo-v2-pro** — 支援推理，具備 100 萬詞元脈絡視窗，適合長文件工作負載。
    - **mimo-v2-omni** — 啟用推理的多模態模型，可接受文字和圖像輸入。

    <Note>
    所有模型都使用 `xiaomi/` 前置詞（例如 `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="疑難排解">
    - 如果模型沒有出現，請確認 `XIAOMI_API_KEY` 已設定且有效。
    - 當 Gateway 以常駐程序執行時，請確保該程序可取得金鑰（例如在 `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，對由常駐程序管理的 Gateway 程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，以便持續提供。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 設定參考。
  </Card>
  <Card title="Xiaomi MiMo 控制台" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 儀表板與 API 金鑰管理。
  </Card>
</CardGroup>
