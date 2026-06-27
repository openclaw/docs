---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn muốn chạy các mô hình qua Kilo Gateway trong OpenClaw
summary: Sử dụng API thống nhất của Kilo Gateway để truy cập nhiều mô hình trong OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:04:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều model phía sau một
endpoint và API key duy nhất. API này tương thích với OpenAI, nên hầu hết OpenAI SDK hoạt động bằng cách chuyển base URL.

| Thuộc tính | Giá trị                            |
| ---------- | ---------------------------------- |
| Nhà cung cấp | `kilocode`                       |
| Xác thực   | `KILOCODE_API_KEY`                 |
| API        | Tương thích với OpenAI             |
| Base URL   | `https://api.kilo.ai/api/gateway/` |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản">
    Truy cập [app.kilo.ai](https://app.kilo.ai), đăng nhập hoặc tạo tài khoản, sau đó chuyển đến API Keys và tạo khóa mới.
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
  <Step title="Xác minh model khả dụng">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model mặc định

Model mặc định là `kilocode/kilo/auto`, một model định tuyến thông minh
do nhà cung cấp sở hữu và được Kilo Gateway quản lý.

<Note>
OpenClaw xem `kilocode/kilo/auto` là ref mặc định ổn định, nhưng không
công bố ánh xạ từ tác vụ đến model upstream có nguồn chứng thực cho route đó. Việc định tuyến
upstream chính xác phía sau `kilocode/kilo/auto` thuộc về Kilo Gateway, không được
hard-code trong OpenClaw.
</Note>

## Catalog tích hợp

OpenClaw tự động khám phá các model khả dụng từ Kilo Gateway khi khởi động. Dùng
`/models kilocode` để xem danh sách đầy đủ các model khả dụng với tài khoản của bạn.

Bất kỳ model nào khả dụng trên gateway đều có thể dùng với tiền tố `kilocode/`:

| Model ref                                | Ghi chú                            |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Mặc định — định tuyến thông minh   |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic qua Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI qua Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google qua Kilo                    |
| ...và nhiều model khác                   | Dùng `/models kilocode` để liệt kê tất cả |

<Tip>
Khi khởi động, OpenClaw truy vấn `GET https://api.kilo.ai/api/gateway/models` và hợp nhất
các model đã khám phá trước catalog fallback tĩnh. Fallback tĩnh luôn
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
  <Accordion title="Truyền tải và khả năng tương thích">
    Kilo Gateway được tài liệu hóa trong mã nguồn là tương thích với OpenRouter, nên nó nằm trên
    đường dẫn tương thích OpenAI kiểu proxy thay vì định hình yêu cầu OpenAI native.

    - Các Kilo ref dựa trên Gemini vẫn nằm trên đường dẫn proxy-Gemini, nên OpenClaw giữ
      việc làm sạch chữ ký suy luận Gemini ở đó mà không bật xác thực phát lại Gemini native
      hoặc ghi lại bootstrap.
    - Kilo Gateway dùng token Bearer với API key của bạn ở bên dưới.

  </Accordion>

  <Accordion title="Stream wrapper và reasoning">
    Stream wrapper dùng chung của Kilo thêm header ứng dụng của nhà cung cấp và chuẩn hóa
    payload reasoning proxy cho các concrete model ref được hỗ trợ.

    <Warning>
    `kilocode/kilo/auto` và các hint khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc
    chèn reasoning. Nếu bạn cần hỗ trợ reasoning, hãy dùng một concrete model ref như
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Nếu việc khám phá model thất bại khi khởi động, OpenClaw fallback về catalog tĩnh chứa `kilocode/kilo/auto`.
    - Xác nhận API key của bạn hợp lệ và tài khoản Kilo của bạn đã bật các model mong muốn.
    - Khi Gateway chạy dưới dạng daemon, hãy đảm bảo `KILOCODE_API_KEY` khả dụng cho tiến trình đó (ví dụ trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Chọn model" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, model ref và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Bảng điều khiển Kilo Gateway, API keys và quản lý tài khoản.
  </Card>
</CardGroup>
