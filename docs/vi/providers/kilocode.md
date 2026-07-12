---
read_when:
    - Bạn muốn dùng một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình thông qua Kilo Gateway trong OpenClaw
summary: Sử dụng API hợp nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T08:18:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway định tuyến yêu cầu đến nhiều mô hình thông qua một điểm cuối tương thích với OpenAI và một khóa API duy nhất.

| Thuộc tính    | Giá trị                            |
| ------------- | ---------------------------------- |
| Nhà cung cấp  | `kilocode`                         |
| Xác thực      | `KILOCODE_API_KEY`                 |
| API           | Tương thích với OpenAI             |
| URL cơ sở     | `https://api.kilo.ai/api/gateway/` |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Thiết lập

<Steps>
  <Step title="Tạo tài khoản">
    Truy cập [app.kilo.ai](https://app.kilo.ai), đăng nhập hoặc tạo tài khoản, sau đó tạo khóa API.
  </Step>
  <Step title="Chạy quy trình làm quen ban đầu">
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

## Mô hình mặc định và danh mục

Mô hình mặc định là `kilocode/kilo/auto`, một mô hình định tuyến thông minh do nhà cung cấp quản lý. OpenClaw không
công bố ánh xạ từ tác vụ đến mô hình thượng nguồn cho mô hình này; việc định tuyến phía sau `kilo/auto` do Kilo Gateway quản lý.

Khi khởi động, OpenClaw truy vấn `GET https://api.kilo.ai/api/gateway/models` và hợp nhất các mô hình được phát hiện
trước danh mục dự phòng tĩnh. Danh mục dự phòng tĩnh chỉ chứa `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Có thể tham chiếu mọi mô hình trên Gateway dưới dạng `kilocode/<upstream-id>` (ví dụ:
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Chạy `/models kilocode` hoặc
`openclaw models list --provider kilocode` để xem danh sách đầy đủ các mô hình được phát hiện.

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

## Ghi chú về hành vi

<AccordionGroup>
  <Accordion title="Giao vận và khả năng tương thích">
    Kilo Gateway tương thích với OpenRouter, vì vậy nó sử dụng đường dẫn yêu cầu tương thích với OpenAI theo kiểu proxy
    thay vì định dạng yêu cầu OpenAI gốc (không có `store`, không có tải trọng mức độ suy luận của OpenAI).

    - Các tham chiếu Kilo sử dụng Gemini vẫn đi theo đường dẫn proxy-Gemini: OpenClaw làm sạch chữ ký suy luận
      của Gemini tại đó nhưng không bật xác thực phát lại Gemini gốc hoặc viết lại khởi tạo.
    - Các yêu cầu sử dụng token Bearer được tạo từ khóa API của bạn.

  </Accordion>

  <Accordion title="Trình bao luồng và suy luận">
    Trình bao luồng Kilo thêm tiêu đề yêu cầu `X-KILOCODE-FEATURE` (mặc định là `openclaw`,
    ghi đè bằng biến môi trường `KILOCODE_FEATURE`) và chuẩn hóa tải trọng mức độ suy luận cho
    các mô hình hỗ trợ tính năng này.

    <Warning>
    Các tham chiếu `kilocode/kilo/auto` và `x-ai/*` bỏ qua việc chèn mức độ suy luận. Hãy sử dụng một tham chiếu mô hình
    cụ thể như `kilocode/anthropic/claude-sonnet-4` nếu bạn cần hỗ trợ suy luận.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu quá trình phát hiện mô hình thất bại khi khởi động, OpenClaw sẽ dùng danh mục dự phòng tĩnh chứa `kilocode/kilo/auto`.
    - Xác nhận khóa API của bạn hợp lệ và tài khoản Kilo của bạn đã bật các mô hình mong muốn.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo tiến trình đó có thể truy cập `KILOCODE_API_KEY` (ví dụ trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Kilo Gateway, khóa API và quản lý tài khoản.
  </Card>
</CardGroup>
