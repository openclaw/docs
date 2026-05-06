---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình thông qua Kilo Gateway trong OpenClaw
summary: Sử dụng API hợp nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một
endpoint và khóa API duy nhất. Dịch vụ này tương thích OpenAI, nên hầu hết OpenAI SDK hoạt động bằng cách chuyển URL cơ sở.

| Thuộc tính | Giá trị                            |
| ---------- | ---------------------------------- |
| Nhà cung cấp | `kilocode`                       |
| Xác thực   | `KILOCODE_API_KEY`                 |
| API        | Tương thích OpenAI                 |
| URL cơ sở  | `https://api.kilo.ai/api/gateway/` |

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản">
    Truy cập [app.kilo.ai](https://app.kilo.ai), đăng nhập hoặc tạo tài khoản, rồi điều hướng đến API Keys và tạo khóa mới.
  </Step>
  <Step title="Chạy quy trình onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Hoặc đặt trực tiếp biến môi trường:

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

Mô hình mặc định là `kilocode/kilo/auto`, một mô hình định tuyến thông minh
do nhà cung cấp sở hữu và được Kilo Gateway quản lý.

<Note>
OpenClaw xem `kilocode/kilo/auto` là ref mặc định ổn định, nhưng không
công bố ánh xạ từ tác vụ đến mô hình upstream có nguồn chứng thực cho tuyến đó. Việc định tuyến
upstream chính xác phía sau `kilocode/kilo/auto` thuộc quyền sở hữu của Kilo Gateway, không được
mã hóa cứng trong OpenClaw.
</Note>

## Danh mục tích hợp

OpenClaw tự động phát hiện các mô hình có sẵn từ Kilo Gateway khi khởi động. Dùng
`/models kilocode` để xem danh sách đầy đủ các mô hình có sẵn với tài khoản của bạn.

Bất kỳ mô hình nào có sẵn trên Gateway đều có thể dùng với tiền tố `kilocode/`:

| Ref mô hình                           | Ghi chú                            |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Mặc định — định tuyến thông minh   |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic qua Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI qua Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google qua Kilo                    |
| ...và nhiều mô hình khác               | Dùng `/models kilocode` để liệt kê tất cả |

<Tip>
Khi khởi động, OpenClaw truy vấn `GET https://api.kilo.ai/api/gateway/models` và hợp nhất
các mô hình được phát hiện trước danh mục dự phòng tĩnh. Danh mục dự phòng được đóng gói luôn
bao gồm `kilocode/kilo/auto` (`Kilo Auto`) với `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000`, và `maxTokens: 128000`.
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
  <Accordion title="Transport và khả năng tương thích">
    Kilo Gateway được ghi trong nguồn là tương thích OpenRouter, nên vẫn đi theo
    đường dẫn proxy-style tương thích OpenAI thay vì định dạng yêu cầu OpenAI gốc.

    - Các ref Kilo dựa trên Gemini vẫn đi theo đường dẫn proxy-Gemini, nên OpenClaw giữ
      việc làm sạch chữ ký suy nghĩ của Gemini ở đó mà không bật xác thực replay Gemini gốc
      hoặc viết lại bootstrap.
    - Kilo Gateway dùng token Bearer với khóa API của bạn ở bên dưới.

  </Accordion>

  <Accordion title="Wrapper luồng và reasoning">
    Wrapper luồng dùng chung của Kilo thêm header ứng dụng nhà cung cấp và chuẩn hóa
    payload reasoning proxy cho các ref mô hình cụ thể được hỗ trợ.

    <Warning>
    `kilocode/kilo/auto` và các gợi ý khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc
    chèn reasoning. Nếu bạn cần hỗ trợ reasoning, hãy dùng một ref mô hình cụ thể như
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu phát hiện mô hình thất bại khi khởi động, OpenClaw quay về danh mục tĩnh được đóng gói chứa `kilocode/kilo/auto`.
    - Xác nhận khóa API của bạn hợp lệ và tài khoản Kilo của bạn đã bật các mô hình mong muốn.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo `KILOCODE_API_KEY` có sẵn cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, ref mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Dashboard Kilo Gateway, khóa API và quản lý tài khoản.
  </Card>
</CardGroup>
