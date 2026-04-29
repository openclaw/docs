---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình thông qua Kilo Gateway trong OpenClaw
summary: Sử dụng API thống nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-29T23:07:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway cung cấp một **API hợp nhất** định tuyến các yêu cầu đến nhiều mô hình phía sau một endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách đổi URL cơ sở.

| Thuộc tính | Giá trị                            |
| ---------- | ---------------------------------- |
| Nhà cung cấp | `kilocode`                       |
| Xác thực   | `KILOCODE_API_KEY`                 |
| API        | Tương thích với OpenAI             |
| URL cơ sở  | `https://api.kilo.ai/api/gateway/` |

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản">
    Truy cập [app.kilo.ai](https://app.kilo.ai), đăng nhập hoặc tạo tài khoản, sau đó đi đến API Keys và tạo khóa mới.
  </Step>
  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Hoặc đặt biến môi trường trực tiếp:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Mô hình mặc định

Mô hình mặc định là `kilocode/kilo/auto`, một mô hình định tuyến thông minh do nhà cung cấp sở hữu và được Kilo Gateway quản lý.

<Note>
OpenClaw coi `kilocode/kilo/auto` là tham chiếu mặc định ổn định, nhưng không công bố ánh xạ tác vụ sang mô hình thượng nguồn có nguồn chứng thực cho tuyến đó. Việc định tuyến thượng nguồn chính xác phía sau `kilocode/kilo/auto` do Kilo Gateway sở hữu, không được mã hóa cứng trong OpenClaw.
</Note>

## Danh mục tích hợp sẵn

OpenClaw tự động phát hiện các mô hình có sẵn từ Kilo Gateway khi khởi động. Dùng `/models kilocode` để xem danh sách đầy đủ các mô hình có sẵn với tài khoản của bạn.

Bất kỳ mô hình nào có sẵn trên gateway đều có thể dùng với tiền tố `kilocode/`:

| Tham chiếu mô hình                   | Ghi chú                            |
| ------------------------------------ | ---------------------------------- |
| `kilocode/kilo/auto`                 | Mặc định — định tuyến thông minh   |
| `kilocode/anthropic/claude-sonnet-4` | Anthropic qua Kilo                 |
| `kilocode/openai/gpt-5.5`            | OpenAI qua Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google qua Kilo                  |
| ...và nhiều mô hình khác             | Dùng `/models kilocode` để liệt kê tất cả |

<Tip>
Khi khởi động, OpenClaw truy vấn `GET https://api.kilo.ai/api/gateway/models` và hợp nhất các mô hình được phát hiện trước danh mục dự phòng tĩnh. Danh mục dự phòng đi kèm luôn bao gồm `kilocode/kilo/auto` (`Kilo Auto`) với `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, và `maxTokens: 128000`.
</Tip>

## Ví dụ cấu hình

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Truyền tải và khả năng tương thích">
    Kilo Gateway được ghi trong nguồn là tương thích với OpenRouter, nên nó tiếp tục dùng đường dẫn tương thích với OpenAI kiểu proxy thay vì định hình yêu cầu OpenAI gốc.

    - Các tham chiếu Kilo dựa trên Gemini vẫn ở trên đường dẫn proxy-Gemini, nên OpenClaw giữ việc làm sạch chữ ký suy nghĩ Gemini ở đó mà không bật xác thực phát lại Gemini gốc hoặc viết lại bootstrap.
    - Kilo Gateway dùng Bearer token với khóa API của bạn ở bên dưới.

  </Accordion>

  <Accordion title="Trình bao stream và reasoning">
    Trình bao stream dùng chung của Kilo thêm tiêu đề ứng dụng nhà cung cấp và chuẩn hóa payload reasoning proxy cho các tham chiếu mô hình cụ thể được hỗ trợ.

    <Warning>
    `kilocode/kilo/auto` và các gợi ý khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc chèn reasoning. Nếu bạn cần hỗ trợ reasoning, hãy dùng một tham chiếu mô hình cụ thể như `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu phát hiện mô hình thất bại khi khởi động, OpenClaw quay về danh mục tĩnh đi kèm có chứa `kilocode/kilo/auto`.
    - Xác nhận khóa API của bạn hợp lệ và tài khoản Kilo của bạn đã bật các mô hình mong muốn.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo `KILOCODE_API_KEY` có sẵn cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Kilo Gateway, khóa API và quản lý tài khoản.
  </Card>
</CardGroup>
