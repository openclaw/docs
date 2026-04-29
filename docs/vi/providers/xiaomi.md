---
read_when:
    - Bạn muốn các mô hình Xiaomi MiMo trong OpenClaw
    - Bạn cần thiết lập XIAOMI_API_KEY
summary: Sử dụng các mô hình Xiaomi MiMo với OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-29T23:10:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo là nền tảng API cho các mô hình **MiMo**. OpenClaw sử dụng điểm cuối tương thích với OpenAI của Xiaomi với xác thực bằng khóa API.

| Thuộc tính | Giá trị                         |
| ---------- | ------------------------------- |
| Nhà cung cấp | `xiaomi`                      |
| Xác thực   | `XIAOMI_API_KEY`                |
| API        | Tương thích với OpenAI          |
| URL cơ sở  | `https://api.xiaomimimo.com/v1` |

## Bắt đầu

<Steps>
  <Step title="Nhận khóa API">
    Tạo khóa API trong [bảng điều khiển Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
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
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình     | Đầu vào     | Ngữ cảnh  | Đầu ra tối đa | Suy luận | Ghi chú          |
| ---------------------- | ----------- | --------- | ------------- | -------- | ---------------- |
| `xiaomi/mimo-v2-flash` | văn bản     | 262,144   | 8,192         | Không    | Mô hình mặc định |
| `xiaomi/mimo-v2-pro`   | văn bản     | 1,048,576 | 32,000        | Có       | Ngữ cảnh lớn     |
| `xiaomi/mimo-v2-omni`  | văn bản, hình ảnh | 262,144   | 32,000        | Có       | Đa phương thức   |

<Tip>
Tham chiếu mô hình mặc định là `xiaomi/mimo-v2-flash`. Nhà cung cấp được tự động chèn khi `XIAOMI_API_KEY` được đặt hoặc khi tồn tại hồ sơ xác thực.
</Tip>

## Chuyển văn bản thành giọng nói

Plugin `xiaomi` được đóng gói cũng đăng ký Xiaomi MiMo làm nhà cung cấp giọng nói cho
`messages.tts`. Plugin này gọi hợp đồng TTS chat-completions của Xiaomi với văn bản dưới dạng
tin nhắn `assistant` và hướng dẫn phong cách tùy chọn dưới dạng tin nhắn `user`.

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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Các giọng nói tích hợp sẵn được hỗ trợ bao gồm `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` và `Dean`. `mimo-v2-tts` được hỗ trợ cho các tài khoản MiMo
TTS cũ hơn; mặc định sử dụng mô hình MiMo-V2.5 TTS hiện tại. Đối với các mục tiêu ghi chú thoại
như Feishu và Telegram, OpenClaw chuyển mã đầu ra của Xiaomi sang Opus 48kHz
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
    Nhà cung cấp `xiaomi` được tự động chèn khi `XIAOMI_API_KEY` được đặt trong môi trường của bạn hoặc khi tồn tại hồ sơ xác thực. Bạn không cần cấu hình thủ công nhà cung cấp trừ khi muốn ghi đè siêu dữ liệu mô hình hoặc URL cơ sở.
  </Accordion>

  <Accordion title="Chi tiết mô hình">
    - **mimo-v2-flash** — nhẹ và nhanh, lý tưởng cho các tác vụ văn bản đa dụng. Không hỗ trợ suy luận.
    - **mimo-v2-pro** — hỗ trợ suy luận với cửa sổ ngữ cảnh 1M token cho khối lượng công việc tài liệu dài.
    - **mimo-v2-omni** — mô hình đa phương thức có bật suy luận, chấp nhận cả đầu vào văn bản và hình ảnh.

    <Note>
    Tất cả mô hình đều dùng tiền tố `xiaomi/` (ví dụ `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu các mô hình không xuất hiện, hãy xác nhận `XIAOMI_API_KEY` đã được đặt và hợp lệ.
    - Khi Gateway chạy như một daemon, hãy đảm bảo khóa có sẵn cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

    <Warning>
    Các khóa chỉ được đặt trong shell tương tác của bạn sẽ không hiển thị với các tiến trình gateway do daemon quản lý. Sử dụng cấu hình `~/.openclaw/.env` hoặc `env.shellEnv` để có khả năng truy cập ổn định.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Bảng điều khiển Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Bảng điều khiển Xiaomi MiMo và quản lý khóa API.
  </Card>
</CardGroup>
