---
read_when:
    - Bạn muốn các mô hình Xiaomi MiMo trong OpenClaw
    - Bạn cần xác thực Xiaomi MiMo hoặc thiết lập Token Plan
summary: Sử dụng các mô hình trả theo mức dùng và Token Plan của Xiaomi MiMo với OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:07:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo là nền tảng API cho các mô hình **MiMo**. OpenClaw bao gồm một Plugin Xiaomi được tích hợp sẵn với hai cấu hình sẵn nhà cung cấp văn bản:

- `xiaomi` cho khóa trả theo mức dùng (`sk-...`)
- `xiaomi-token-plan` cho khóa Token Plan (`tp-...`) với các cấu hình sẵn điểm cuối theo khu vực

Cùng Plugin đó cũng đăng ký nhà cung cấp giọng nói (TTS) `xiaomi`.

| Thuộc tính       | Giá trị                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID nhà cung cấp  | `xiaomi` (trả theo mức dùng), `xiaomi-token-plan` (Token Plan)                                                                                     |
| Plugin           | tích hợp sẵn, `enabledByDefault: true`                                                                                                             |
| Biến môi trường xác thực | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                              |
| Cờ onboarding    | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Cờ CLI trực tiếp | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| Hợp đồng         | chat completions + `speechProviders`                                                                                                               |
| API              | tương thích OpenAI (`openai-completions`)                                                                                                          |
| URL cơ sở        | Trả theo mức dùng: `https://api.xiaomimimo.com/v1`; cấu hình sẵn Token Plan: `token-plan-{cn,sgp,ams}...`                                          |
| Mô hình mặc định | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS mặc định     | `mimo-v2.5-tts`, giọng `mimo_default`; mô hình voicedesign `mimo-v2.5-tts-voicedesign`                                                             |

## Bắt đầu

<Steps>
  <Step title="Get the right key">
    Tạo một khóa trả theo mức dùng trong [bảng điều khiển Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), hoặc mở trang đăng ký Token Plan của bạn rồi sao chép URL cơ sở tương thích OpenAI theo khu vực cùng khóa `tp-...` tương ứng.
  </Step>

  <Step title="Run onboarding">
    Trả theo mức dùng:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Hoặc truyền khóa trực tiếp:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Danh mục trả theo mức dùng

| Tham chiếu mô hình      | Đầu vào     | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú          |
| ---------------------- | ----------- | --------- | ------------- | -------- | ---------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192         | Không    | Mô hình mặc định |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000        | Có       | Ngữ cảnh lớn     |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000        | Có       | Đa phương thức   |

<Tip>
Tham chiếu mô hình mặc định là `xiaomi/mimo-v2-flash`. Nhà cung cấp được chèn tự động khi `XIAOMI_API_KEY` được đặt hoặc khi có hồ sơ xác thực.
</Tip>

## Danh mục Token Plan

Chọn tùy chọn xác thực Token Plan khớp với URL cơ sở theo khu vực được hiển thị trong giao diện đăng ký của Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Tham chiếu mô hình                 | Đầu vào     | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú          |
| --------------------------------- | ----------- | --------- | ------------- | -------- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | text        | 1,048,576 | 131,072       | Có       | Mô hình mặc định |
| `xiaomi-token-plan/mimo-v2.5`     | text, image | 1,048,576 | 131,072       | Có       | Đa phương thức   |

<Tip>
Onboarding Token Plan xác thực định dạng khóa và cảnh báo khi khóa `tp-...` được nhập vào đường dẫn trả theo mức dùng, hoặc khóa `sk-...` được nhập vào đường dẫn Token Plan.
</Tip>

## Chuyển văn bản thành giọng nói

Plugin `xiaomi` được tích hợp sẵn cũng đăng ký Xiaomi MiMo làm nhà cung cấp giọng nói cho
`messages.tts`. Nó gọi hợp đồng TTS chat-completions của Xiaomi với văn bản dưới dạng
tin nhắn `assistant` và hướng dẫn phong cách tùy chọn dưới dạng tin nhắn `user`.

| Thuộc tính | Giá trị                                  |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (bí danh `mimo`)                |
| Xác thực | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` với `audio`  |
| Mặc định | `mimo-v2.5-tts`, giọng `mimo_default`    |
| Đầu ra   | MP3 theo mặc định; WAV khi được cấu hình |

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
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Các giọng tích hợp được hỗ trợ bao gồm `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` và `Dean`. Các mô hình giọng đặt sẵn dùng `audio.voice`, nên
OpenClaw gửi `speakerVoice` cho `mimo-v2.5-tts` và `mimo-v2-tts`.

Mô hình voicedesign của Xiaomi, `mimo-v2.5-tts-voicedesign`, tạo giọng nói
từ lời nhắc phong cách bằng ngôn ngữ tự nhiên thay vì ID giọng đặt sẵn. Cấu hình
`style` bằng mô tả giọng mong muốn; OpenClaw gửi nó dưới dạng tin nhắn `user`,
gửi văn bản được đọc dưới dạng tin nhắn `assistant` và bỏ qua
`audio.voice` cho mô hình này.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Đối với các mục tiêu ghi chú giọng nói như Feishu và Telegram, OpenClaw chuyển mã
đầu ra Xiaomi sang Opus 48kHz bằng `ffmpeg` trước khi gửi.

## Ví dụ cấu hình

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
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Giá và cờ tương thích đến từ manifest Plugin được tích hợp sẵn, nên ví dụ cấu hình bỏ qua `cost` và `compat` để tránh lệch khỏi hành vi runtime.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Giá đến từ manifest được tích hợp sẵn (các mô hình Token Plan bao gồm giá đọc bộ nhớ đệm theo bậc), nên ví dụ cấu hình bỏ qua `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    Nhà cung cấp `xiaomi` được chèn tự động khi `XIAOMI_API_KEY` được đặt trong môi trường của bạn hoặc khi có hồ sơ xác thực. `xiaomi-token-plan` cần URL cơ sở theo khu vực, nên đường dẫn được hỗ trợ là tùy chọn onboarding Token Plan được tích hợp sẵn hoặc khối cấu hình `models.providers.xiaomi-token-plan` rõ ràng.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — nhẹ và nhanh, lý tưởng cho các tác vụ văn bản đa dụng. Không hỗ trợ suy luận.
    - **mimo-v2-pro** — hỗ trợ suy luận với cửa sổ ngữ cảnh 1M token cho khối lượng công việc tài liệu dài.
    - **mimo-v2-omni** — mô hình đa phương thức có hỗ trợ suy luận, chấp nhận cả đầu vào văn bản và hình ảnh.
    - **mimo-v2.5-pro** — mặc định của Token Plan với stack suy luận V2.5 hiện tại của Xiaomi.
    - **mimo-v2.5** — tuyến V2.5 đa phương thức của Token Plan.

    <Note>
    Các mô hình trả theo mức dùng sử dụng tiền tố `xiaomi/`. Các mô hình Token Plan sử dụng tiền tố `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Nếu mô hình không xuất hiện, hãy xác nhận biến môi trường khóa liên quan hoặc hồ sơ xác thực hiện diện và hợp lệ.
    - Với Token Plan, hãy xác nhận khu vực onboarding đã chọn khớp với URL cơ sở trên trang đăng ký và khóa bắt đầu bằng `tp-`.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo khóa có sẵn cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các tiến trình Gateway do daemon quản lý. Dùng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để đảm bảo khả dụng lâu dài.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham khảo cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Xiaomi MiMo và quản lý khóa API.
  </Card>
</CardGroup>
