---
read_when:
    - Bạn muốn dùng các mô hình Xiaomi MiMo trong OpenClaw
    - Bạn cần thiết lập XIAOMI_API_KEY
summary: Sử dụng các mô hình Xiaomi MiMo với OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo là nền tảng API cho các mô hình **MiMo**. OpenClaw bao gồm một Plugin `xiaomi` được đóng gói sẵn, đăng ký cả nhà cung cấp chat tương thích OpenAI và nhà cung cấp giọng nói (TTS) dùng cùng `XIAOMI_API_KEY`.

| Thuộc tính      | Giá trị                                  |
| --------------- | ---------------------------------------- |
| ID nhà cung cấp | `xiaomi`                                 |
| Plugin          | đóng gói sẵn, `enabledByDefault: true`   |
| Biến môi trường xác thực | `XIAOMI_API_KEY`                 |
| Cờ onboarding   | `--auth-choice xiaomi-api-key`           |
| Cờ CLI trực tiếp | `--xiaomi-api-key <key>`                |
| Hợp đồng        | hoàn tất chat + `speechProviders`        |
| API             | tương thích OpenAI (`openai-completions`) |
| URL cơ sở       | `https://api.xiaomimimo.com/v1`          |
| Mô hình mặc định | `xiaomi/mimo-v2-flash`                  |
| TTS mặc định    | `mimo-v2.5-tts`, giọng `mimo_default`    |

## Bắt đầu

<Steps>
  <Step title="Lấy API key">
    Tạo API key trong [bảng điều khiển Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Hoặc truyền trực tiếp khóa:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình      | Đầu vào     | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú        |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | văn bản     | 262,144   | 8,192      | Không     | Mô hình mặc định |
| `xiaomi/mimo-v2-pro`   | văn bản     | 1,048,576 | 32,000     | Có        | Ngữ cảnh lớn |
| `xiaomi/mimo-v2-omni`  | văn bản, hình ảnh | 262,144 | 32,000     | Có        | Đa phương thức |

<Tip>
Tham chiếu mô hình mặc định là `xiaomi/mimo-v2-flash`. Nhà cung cấp được tự động chèn khi `XIAOMI_API_KEY` được đặt hoặc khi có hồ sơ xác thực.
</Tip>

## Chuyển văn bản thành giọng nói

Plugin `xiaomi` được đóng gói sẵn cũng đăng ký Xiaomi MiMo làm nhà cung cấp giọng nói cho
`messages.tts`. Plugin này gọi hợp đồng TTS chat-completions của Xiaomi với văn bản dưới dạng
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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Các giọng tích hợp sẵn được hỗ trợ gồm `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` và `Dean`. `mimo-v2-tts` được hỗ trợ cho các tài khoản MiMo
TTS cũ hơn; mặc định sử dụng mô hình TTS MiMo-V2.5 hiện tại. Với các đích ghi âm thoại
như Feishu và Telegram, OpenClaw chuyển mã đầu ra Xiaomi sang Opus 48kHz
bằng `ffmpeg` trước khi gửi.

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
  <Accordion title="Hành vi tự động chèn">
    Nhà cung cấp `xiaomi` được tự động chèn khi `XIAOMI_API_KEY` được đặt trong môi trường của bạn hoặc khi có hồ sơ xác thực. Bạn không cần cấu hình thủ công nhà cung cấp trừ khi muốn ghi đè siêu dữ liệu mô hình hoặc URL cơ sở.
  </Accordion>

  <Accordion title="Chi tiết mô hình">
    - **mimo-v2-flash** — nhẹ và nhanh, lý tưởng cho các tác vụ văn bản đa dụng. Không hỗ trợ suy luận.
    - **mimo-v2-pro** — hỗ trợ suy luận với cửa sổ ngữ cảnh 1 triệu token cho khối lượng công việc tài liệu dài.
    - **mimo-v2-omni** — mô hình đa phương thức có hỗ trợ suy luận, chấp nhận cả đầu vào văn bản và hình ảnh.

    <Note>
    Tất cả mô hình sử dụng tiền tố `xiaomi/` (ví dụ `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu các mô hình không xuất hiện, hãy xác nhận `XIAOMI_API_KEY` đã được đặt và hợp lệ.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo khóa khả dụng cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các tiến trình gateway do daemon quản lý. Sử dụng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để đảm bảo khả dụng lâu dài.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu tham khảo cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham khảo cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Bảng điều khiển Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Xiaomi MiMo và quản lý API key.
  </Card>
</CardGroup>
