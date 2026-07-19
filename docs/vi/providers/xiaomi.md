---
read_when:
    - Bạn muốn sử dụng các mô hình Xiaomi MiMo trong OpenClaw
    - Bạn cần thiết lập xác thực Xiaomi MiMo hoặc Token Plan
summary: Sử dụng các mô hình trả theo mức dùng và Gói Token của Xiaomi MiMo với OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-19T05:56:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 072e3772f5b6d49837a0909e982cb5a03bd532c4804b4eb2e94dc501e6aab58c
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo là nền tảng API dành cho các mô hình **MiMo**. Plugin `xiaomi`
được tích hợp sẵn (`enabledByDefault: true`, không cần cài đặt) đăng ký hai nhà cung cấp
văn bản cùng một nhà cung cấp giọng nói (TTS):

- `xiaomi` - khóa trả phí theo mức sử dụng (`sk-...`)
- `xiaomi-token-plan` - khóa Gói Token (`tp-...`) với các cấu hình sẵn điểm cuối theo khu vực

| Thuộc tính           | Giá trị                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID nhà cung cấp      | `xiaomi` (trả phí theo mức sử dụng), `xiaomi-token-plan` (Gói Token)                                                                                         |
| Biến môi trường xác thực | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Cờ thiết lập ban đầu | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Cờ CLI trực tiếp     | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                  | Hoàn thành trò chuyện tương thích với OpenAI (`openai-completions`)                                                                                          |
| Hợp đồng giọng nói   | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL cơ sở            | Trả phí theo mức sử dụng: `https://api.xiaomimimo.com/v1`; Gói Token: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| Mô hình mặc định     | `xiaomi/mimo-v2.5`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                              |
| TTS mặc định         | `mimo-v2.5-tts`, giọng nói `mimo_default`; mô hình thiết kế giọng nói `mimo-v2.5-tts-voicedesign`                                                               |

## Bắt đầu

<Steps>
  <Step title="Lấy đúng khóa">
    Tạo khóa trả phí theo mức sử dụng trong [bảng điều khiển Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), hoặc mở trang đăng ký Gói Token và sao chép URL cơ sở tương thích với OpenAI theo khu vực cùng khóa `tp-...` tương ứng.
  </Step>

  <Step title="Chạy thiết lập ban đầu">
    Trả phí theo mức sử dụng:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Gói Token:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Hoặc truyền trực tiếp các khóa:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Quá trình thiết lập ban đầu xác thực định dạng khóa và cảnh báo khi khóa `tp-...` được nhập vào luồng trả phí theo mức sử dụng, hoặc khóa `sk-...` được nhập vào luồng Gói Token.
</Tip>

## Danh mục trả phí theo mức sử dụng

| Tham chiếu mô hình        | Đầu vào      | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú           |
| ------------------------- | ------------ | --------- | ------------ | -------- | ----------------- |
| `xiaomi/mimo-v2.5`        | văn bản, hình ảnh | 1,048,576 | 131,072      | Có       | Mô hình mặc định  |
| `xiaomi/mimo-v2.5-pro` | văn bản      | 1,048,576 | 131,072      | Có       | Chủ lực           |

## Danh mục Gói Token

Chọn phương thức xác thực Gói Token khớp với URL cơ sở theo khu vực hiển thị trong giao diện đăng ký của Xiaomi:

| Phương thức xác thực      | URL cơ sở                                  |
| ------------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Tham chiếu mô hình                 | Đầu vào      | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú          |
| ---------------------------------- | ------------ | --------- | ------------ | -------- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | văn bản      | 1,048,576 | 131,072      | Có       | Mô hình mặc định |
| `xiaomi-token-plan/mimo-v2.5`     | văn bản, hình ảnh | 1,048,576 | 131,072      | Có       | Đa phương thức   |

`xiaomi-token-plan` cần URL cơ sở theo khu vực để phân giải. Luồng được hỗ trợ
là một lựa chọn thiết lập ban đầu Gói Token được tích hợp sẵn hoặc một khối cấu hình
`models.providers.xiaomi-token-plan` tường minh có đặt `baseUrl`; nhà
cung cấp không được cung cấp nếu thiếu một trong hai điều kiện đó.

## Mô hình suy luận

`mimo-v2.5` và `mimo-v2.5-pro` hỗ trợ
[chỉ thị `/think`](/vi/tools/thinking) của OpenClaw với các mức `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` và `max` (mặc định `high`).

## Chuyển văn bản thành giọng nói

Plugin `xiaomi` được tích hợp sẵn cũng đăng ký Xiaomi MiMo làm nhà cung cấp giọng nói
cho `messages.tts`. Plugin gọi hợp đồng TTS hoàn thành trò chuyện của Xiaomi với
văn bản dưới dạng thông điệp `assistant` và hướng dẫn phong cách tùy chọn dưới dạng thông điệp
`user`.

| Thuộc tính | Giá trị                                  |
| ---------- | ---------------------------------------- |
| ID TTS     | `xiaomi` (bí danh `mimo`)                  |
| Xác thực   | `XIAOMI_API_KEY`                         |
| API        | `POST /v1/chat/completions` với `audio` |
| Mặc định   | `mimo-v2.5-tts`, giọng nói `mimo_default`    |
| Đầu ra     | MP3 theo mặc định; WAV khi được cấu hình |

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

Các giọng nói tích hợp sẵn: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Mô hình giọng nói đặt sẵn `mimo-v2.5-tts` sử dụng `audio.voice`, vì vậy
OpenClaw gửi `speakerVoice` cho mô hình đó.

Mô hình thiết kế giọng nói `mimo-v2.5-tts-voicedesign` tạo giọng nói từ một
lời nhắc phong cách bằng ngôn ngữ tự nhiên thay vì ID giọng nói đặt sẵn. Đặt `style` thành
mô tả giọng nói mong muốn; OpenClaw gửi mô tả đó dưới dạng thông điệp `user`, gửi
văn bản cần đọc dưới dạng thông điệp `assistant` và bỏ qua `audio.voice` đối với
mô hình này.

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

Đối với các kênh yêu cầu đích tổng hợp ghi chú thoại (Discord, Feishu,
Matrix, Telegram và WhatsApp), OpenClaw chuyển mã đầu ra Xiaomi thành Opus đơn âm 48kHz
bằng `ffmpeg` trước khi gửi.

## Ví dụ cấu hình

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2.5" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Thông tin giá và các cờ tương thích đến từ bản kê khai Plugin được tích hợp sẵn, vì vậy ví dụ cấu hình bỏ qua `cost` và `compat` để tránh sai lệch so với hành vi thời gian chạy.

Gói Token:

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

Thông tin giá đến từ bản kê khai được tích hợp sẵn (các mô hình Gói Token bao gồm giá đọc bộ nhớ đệm theo bậc), vì vậy ví dụ cấu hình bỏ qua `cost`.

<AccordionGroup>
  <Accordion title="Hành vi tự động chèn">
    Nhà cung cấp `xiaomi` được tự động bật khi `XIAOMI_API_KEY` được đặt trong môi trường của bạn hoặc có hồ sơ xác thực. `xiaomi-token-plan` cần URL cơ sở theo khu vực, vì vậy luồng được hỗ trợ là lựa chọn thiết lập ban đầu Gói Token được tích hợp sẵn hoặc một khối cấu hình `models.providers.xiaomi-token-plan` tường minh.
  </Accordion>

  <Accordion title="Chi tiết mô hình">
    - **mimo-v2.5** - mô hình mặc định trả phí theo mức sử dụng và tuyến V2.5 đa phương thức của Gói Token.
    - **mimo-v2.5-pro** - mô hình suy luận chủ lực và mô hình mặc định của Gói Token.

    <Note>
    Các mô hình trả phí theo mức sử dụng dùng tiền tố `xiaomi/`. Các mô hình Gói Token dùng tiền tố `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu các mô hình không xuất hiện, hãy xác nhận biến môi trường khóa hoặc hồ sơ xác thực tương ứng có tồn tại và hợp lệ.
    - Đối với Gói Token, hãy xác nhận khu vực thiết lập ban đầu đã chọn khớp với URL cơ sở trên trang đăng ký và khóa bắt đầu bằng `tp-`.
    - Khi Gateway chạy dưới dạng daemon, hãy bảo đảm khóa khả dụng cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các tiến trình Gateway do daemon quản lý. Sử dụng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để duy trì tính khả dụng.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Các mức suy nghĩ" href="/vi/tools/thinking" icon="brain">
    Cú pháp chỉ thị `/think` và ánh xạ mức.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Bảng điều khiển Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Xiaomi MiMo và quản lý khóa API.
  </Card>
</CardGroup>
