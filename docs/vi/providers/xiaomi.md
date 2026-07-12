---
read_when:
    - Bạn muốn sử dụng các mô hình Xiaomi MiMo trong OpenClaw
    - Bạn cần thiết lập xác thực Xiaomi MiMo hoặc Gói Token
summary: Sử dụng các mô hình trả theo mức dùng và Gói Token của Xiaomi MiMo với OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T08:22:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo là nền tảng API cho các mô hình **MiMo**. Plugin `xiaomi` đi kèm (`enabledByDefault: true`, không cần bước cài đặt) đăng ký hai nhà cung cấp văn bản cùng một nhà cung cấp giọng nói (TTS):

- `xiaomi` - khóa trả theo mức sử dụng (`sk-...`)
- `xiaomi-token-plan` - khóa Token Plan (`tp-...`) với các cấu hình sẵn điểm cuối theo khu vực

| Thuộc tính                    | Giá trị                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID nhà cung cấp               | `xiaomi` (trả theo mức sử dụng), `xiaomi-token-plan` (Token Plan)                                                                                   |
| Biến môi trường xác thực      | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Cờ thiết lập ban đầu          | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Cờ CLI trực tiếp              | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                           | API hoàn tất trò chuyện tương thích với OpenAI (`openai-completions`)                                                                               |
| Hợp đồng giọng nói            | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL cơ sở                     | Trả theo mức sử dụng: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                     |
| Mô hình mặc định              | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS mặc định                  | `mimo-v2.5-tts`, giọng `mimo_default`; mô hình thiết kế giọng nói `mimo-v2.5-tts-voicedesign`                                                       |

## Bắt đầu

<Steps>
  <Step title="Lấy đúng khóa">
    Tạo khóa trả theo mức sử dụng trong [bảng điều khiển Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), hoặc mở trang đăng ký Token Plan của bạn rồi sao chép URL cơ sở tương thích với OpenAI theo khu vực cùng khóa `tp-...` tương ứng.
  </Step>

  <Step title="Chạy thiết lập ban đầu">
    Trả theo mức sử dụng:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

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
Quá trình thiết lập ban đầu xác thực định dạng khóa và cảnh báo khi khóa `tp-...` được nhập vào luồng trả theo mức sử dụng hoặc khóa `sk-...` được nhập vào luồng Token Plan.
</Tip>

## Danh mục trả theo mức sử dụng

| Tham chiếu mô hình      | Đầu vào      | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú            |
| ----------------------- | ------------ | --------- | ------------ | ------- | ------------------ |
| `xiaomi/mimo-v2-flash`  | văn bản      | 262,144   | 8,192        | Không   | Mô hình mặc định   |
| `xiaomi/mimo-v2-pro`    | văn bản      | 1,048,576 | 32,000       | Có      | Ngữ cảnh lớn       |
| `xiaomi/mimo-v2-omni`   | văn bản, ảnh | 262,144   | 32,000       | Có      | Đa phương thức     |

## Danh mục Token Plan

Chọn phương thức xác thực Token Plan khớp với URL cơ sở theo khu vực hiển thị trong giao diện đăng ký của Xiaomi:

| Phương thức xác thực     | URL cơ sở                                  |
| ------------------------ | ------------------------------------------ |
| `xiaomi-token-plan-cn`   | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`  | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`  | `https://token-plan-ams.xiaomimimo.com/v1` |

| Tham chiếu mô hình               | Đầu vào      | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú          |
| -------------------------------- | ------------ | --------- | ------------ | ------- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | văn bản      | 1,048,576 | 131,072      | Có      | Mô hình mặc định |
| `xiaomi-token-plan/mimo-v2.5`     | văn bản, ảnh | 1,048,576 | 131,072      | Có      | Đa phương thức   |

`xiaomi-token-plan` cần một URL cơ sở theo khu vực để phân giải. Luồng được hỗ trợ là chọn một phương thức thiết lập ban đầu Token Plan đi kèm hoặc dùng một khối cấu hình `models.providers.xiaomi-token-plan` tường minh có đặt `baseUrl`; nhà cung cấp sẽ không được cung cấp nếu thiếu một trong hai yếu tố đó.

## Các mô hình suy luận

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` và `mimo-v2.5-pro` hỗ trợ [chỉ thị `/think`](/vi/tools/thinking) của OpenClaw với các mức `off`, `minimal`, `low`, `medium`, `high`, `xhigh` và `max` (mặc định là `high`). `mimo-v2-flash` không hỗ trợ suy luận.

## Chuyển văn bản thành giọng nói

Plugin `xiaomi` đi kèm cũng đăng ký Xiaomi MiMo làm nhà cung cấp giọng nói cho `messages.tts`. Plugin gọi hợp đồng TTS hoàn tất trò chuyện của Xiaomi, trong đó văn bản là một tin nhắn `assistant` và hướng dẫn phong cách tùy chọn là một tin nhắn `user`.

| Thuộc tính | Giá trị                                  |
| ---------- | ---------------------------------------- |
| ID TTS     | `xiaomi` (bí danh `mimo`)                |
| Xác thực   | `XIAOMI_API_KEY`                         |
| API        | `POST /v1/chat/completions` với `audio`  |
| Mặc định   | `mimo-v2.5-tts`, giọng `mimo_default`    |
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

Các giọng tích hợp sẵn: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`, `Milo`, `Dean`. Các mô hình dùng giọng cài sẵn (`mimo-v2.5-tts`, `mimo-v2-tts`) sử dụng `audio.voice`, vì vậy OpenClaw gửi `speakerVoice` cho các mô hình đó.

Mô hình thiết kế giọng nói `mimo-v2.5-tts-voicedesign` tạo giọng nói từ lời nhắc phong cách bằng ngôn ngữ tự nhiên thay vì ID giọng cài sẵn. Đặt `style` thành phần mô tả giọng mong muốn; OpenClaw gửi nội dung đó dưới dạng tin nhắn `user`, gửi văn bản cần đọc dưới dạng tin nhắn `assistant` và bỏ qua `audio.voice` đối với mô hình này.

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

Đối với các kênh yêu cầu đích tổng hợp ghi chú thoại (Discord, Feishu, Matrix, Telegram và WhatsApp), OpenClaw chuyển mã đầu ra của Xiaomi sang Opus đơn kênh 48 kHz bằng `ffmpeg` trước khi phân phối.

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

Giá và các cờ tương thích lấy từ bản kê khai của plugin đi kèm, vì vậy ví dụ cấu hình bỏ qua `cost` và `compat` để tránh sai khác với hành vi thời gian chạy.

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

Giá lấy từ bản kê khai đi kèm (các mô hình Token Plan bao gồm giá đọc bộ nhớ đệm theo bậc), vì vậy ví dụ cấu hình bỏ qua `cost`.

<AccordionGroup>
  <Accordion title="Hành vi tự động chèn">
    Nhà cung cấp `xiaomi` được tự động bật khi `XIAOMI_API_KEY` được đặt trong môi trường của bạn hoặc tồn tại hồ sơ xác thực. `xiaomi-token-plan` cần một URL cơ sở theo khu vực, vì vậy luồng được hỗ trợ là chọn phương thức thiết lập ban đầu Token Plan đi kèm hoặc dùng một khối cấu hình `models.providers.xiaomi-token-plan` tường minh.
  </Accordion>

  <Accordion title="Chi tiết mô hình">
    - **mimo-v2-flash** - gọn nhẹ và nhanh, lý tưởng cho các tác vụ văn bản đa dụng. Không hỗ trợ suy luận.
    - **mimo-v2-pro** - hỗ trợ suy luận với cửa sổ ngữ cảnh 1 triệu token dành cho khối lượng công việc xử lý tài liệu dài.
    - **mimo-v2-omni** - mô hình đa phương thức hỗ trợ suy luận, chấp nhận cả đầu vào văn bản và hình ảnh.
    - **mimo-v2.5-pro** - mô hình mặc định của Token Plan với ngăn xếp suy luận V2.5 hiện tại của Xiaomi.
    - **mimo-v2.5** - tuyến V2.5 đa phương thức của Token Plan.

    <Note>
    Các mô hình trả theo mức sử dụng dùng tiền tố `xiaomi/`. Các mô hình Token Plan dùng tiền tố `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu các mô hình không xuất hiện, hãy xác nhận biến môi trường khóa hoặc hồ sơ xác thực tương ứng tồn tại và hợp lệ.
    - Đối với Token Plan, hãy xác nhận khu vực thiết lập ban đầu đã chọn khớp với URL cơ sở trên trang đăng ký và khóa bắt đầu bằng `tp-`.
    - Khi Gateway chạy dưới dạng tiến trình nền, hãy đảm bảo khóa khả dụng cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các tiến trình Gateway do tiến trình nền quản lý. Hãy sử dụng `~/.openclaw/.env` hoặc cấu hình `env.shellEnv` để bảo đảm tính khả dụng lâu dài.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Các mức suy luận" href="/vi/tools/thinking" icon="brain">
    Cú pháp chỉ thị `/think` và ánh xạ mức.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Bảng điều khiển Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Xiaomi MiMo và chức năng quản lý khóa API.
  </Card>
</CardGroup>
