---
read_when:
    - Bạn muốn suy luận chú trọng quyền riêng tư trong OpenClaw
    - Bạn cần hướng dẫn thiết lập Venice AI
summary: Sử dụng các mô hình chú trọng quyền riêng tư của Venice AI trong OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T06:00:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) cung cấp khả năng suy luận tập trung vào quyền riêng tư: các mô hình mở chạy
không ghi nhật ký, cùng với quyền truy cập proxy ẩn danh vào Claude, GPT, Gemini và Grok.
Tất cả endpoint đều tương thích với OpenAI (`/v1`).

## Chế độ riêng tư

| Chế độ           | Cách hoạt động                                                         | Mô hình                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Riêng tư**    | Prompt/phản hồi không bao giờ được lưu trữ hoặc ghi nhật ký. Chỉ tồn tại tạm thời.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, v.v. |
| **Ẩn danh** | Được chuyển tiếp qua Venice sau khi loại bỏ siêu dữ liệu. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Các mô hình ẩn danh không hoàn toàn riêng tư. Venice loại bỏ siêu dữ liệu trước khi chuyển tiếp, nhưng nhà cung cấp nền tảng (OpenAI, Anthropic, Google, xAI) vẫn xử lý yêu cầu. Hãy dùng các mô hình Riêng tư khi cần bảo đảm quyền riêng tư hoàn toàn.
</Warning>

## Bắt đầu

<Steps>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Lấy khóa API">
    1. Đăng ký tại [venice.ai](https://venice.ai)
    2. Đi tới **Settings > API Keys > Create new key**
    3. Sao chép khóa API của bạn (định dạng: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Cấu hình OpenClaw">
    <Tabs>
      <Tab title="Tương tác (khuyên dùng)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Yêu cầu nhập khóa API (hoặc sử dụng lại `VENICE_API_KEY` hiện có), liệt kê các mô hình Venice khả dụng và đặt mô hình mặc định của bạn.
      </Tab>
      <Tab title="Biến môi trường">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Không tương tác">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Xác minh thiết lập">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Xin chào, bạn có đang hoạt động không?"
    ```
  </Step>
</Steps>

## Chọn mô hình

- **Mặc định**: `venice/kimi-k2-5` (riêng tư, suy luận, thị giác).
- **Lựa chọn ẩn danh mạnh nhất**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Bạn cũng có thể chạy `openclaw configure` và chọn **Model/auth provider > Venice AI**.

<Tip>
| Trường hợp sử dụng              | Mô hình                                        | Lý do                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| Trò chuyện chung (mặc định) | `kimi-k2-5`                                  | Suy luận riêng tư mạnh mẽ cùng khả năng thị giác   |
| Chất lượng tổng thể tốt nhất   | `claude-opus-4-6`                            | Lựa chọn Venice ẩn danh mạnh nhất     |
| Riêng tư + lập trình       | `qwen3-coder-480b-a35b-instruct-turbo`       | Mô hình lập trình riêng tư với ngữ cảnh lớn |
| Nhanh + rẻ           | `llama-3.2-3b`                               | Mô hình riêng tư nhỏ gọn                  |
| Tác vụ riêng tư phức tạp  | `deepseek-v3.2`                              | Suy luận mạnh; tính năng gọi công cụ bị tắt |
| Không kiểm duyệt             | `venice-uncensored-1-2`                      | Mô hình Venice không kiểm duyệt hiện tại        |
</Tip>

## Danh mục tích hợp sẵn (30 mô hình)

<AccordionGroup>
  <Accordion title="Mô hình riêng tư (20) — hoàn toàn riêng tư, không ghi nhật ký">
    | ID mô hình                               | Tên                                 | Ngữ cảnh | Ghi chú                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | Mặc định, suy luận, thị giác  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | Đa dụng                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | Đa dụng                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | Đa dụng, công cụ bị tắt     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Suy luận                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | Đa dụng                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Lập trình                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Suy luận, thị giác           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | Đa dụng                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | Thị giác                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Suy luận, công cụ bị tắt    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Thị giác                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | Đa dụng                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | Đa dụng                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Suy luận                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | Đa dụng                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Suy luận                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Suy luận                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Suy luận                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Suy luận                    |
  </Accordion>

  <Accordion title="Mô hình ẩn danh (10) — qua proxy Venice">
    | ID mô hình                        | Tên                           | Ngữ cảnh | Ghi chú                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (qua Venice)    | 1M      | Suy luận, thị giác            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (qua Venice)  | 1M      | Suy luận, thị giác            |
    | `openai-gpt-54`                 | GPT-5.4 (qua Venice)            | 1M      | Suy luận, thị giác            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (qua Venice)      | 400k    | Suy luận, thị giác, lập trình     |
    | `openai-gpt-52`                 | GPT-5.2 (qua Venice)            | 256k    | Suy luận                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (qua Venice)      | 256k    | Suy luận, thị giác, lập trình     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (qua Venice)             | 128k    | Thị giác                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (qua Venice)        | 128k    | Thị giác                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (qua Venice)     | 1M      | Suy luận, thị giác             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (qua Venice)     | 256k    | Suy luận, thị giác             |
  </Accordion>
</AccordionGroup>

Các mô hình Venice dựa trên Grok (`grok-4-3` và các mô hình tương tự) nhận cùng bản vá
tương thích lược đồ công cụ như nhà cung cấp xAI gốc, vì chúng dùng chung định dạng
gọi công cụ thượng nguồn.

## Khám phá mô hình

Danh mục tích hợp ở trên là danh sách khởi tạo dựa trên manifest. Trong thời gian chạy, OpenClaw
làm mới danh mục từ API `/models` của Venice và dùng lại danh sách khởi tạo nếu
không thể truy cập API. Endpoint `/models` là công khai (không cần xác thực để
liệt kê), nhưng việc suy luận yêu cầu khóa API hợp lệ.

Venice có thể tiếp tục chấp nhận các ID mô hình đã ngừng hoạt động dưới dạng bí danh do nhà cung cấp quản lý.
Danh mục OpenClaw chỉ công bố các ID mô hình chính thức do `/models` trả về.

## Hành vi phát lại của DeepSeek V4

Nếu Venice cung cấp các mô hình DeepSeek V4 như `deepseek-v4-pro` hoặc
`deepseek-v4-flash`, OpenClaw điền trường phát lại bắt buộc `reasoning_content`
vào thông báo của trợ lý khi Venice bỏ qua trường này, đồng thời loại bỏ `thinking`/
`reasoning`/`reasoning_effort` khỏi payload yêu cầu (Venice từ chối
điều khiển `thinking` gốc của DeepSeek trên các mô hình này). Bản sửa lỗi phát lại này
tách biệt với các điều khiển tư duy riêng của nhà cung cấp DeepSeek gốc.

## Hỗ trợ truyền phát và công cụ

| Tính năng          | Mức hỗ trợ                                           |
| ---------------- | ------------------------------------------------- |
| Truyền phát        | Tất cả mô hình                                        |
| Gọi hàm | Hầu hết mô hình; bị tắt theo từng mô hình khi có ghi chú ở trên |
| Thị giác/Hình ảnh    | Các mô hình được đánh dấu "Thị giác" ở trên                      |
| Chế độ JSON        | Qua `response_format`                             |

## Giá

Venice sử dụng hệ thống dựa trên tín dụng. Các mô hình ẩn danh có chi phí gần tương đương
giá API trực tiếp cộng thêm một khoản phí nhỏ của Venice. Xem
[venice.ai/pricing](https://venice.ai/pricing) để biết mức giá hiện tại.

## Ví dụ sử dụng

```bash
# Mô hình riêng tư mặc định
openclaw agent --model venice/kimi-k2-5 --message "Kiểm tra nhanh tình trạng hoạt động"

# Claude Opus qua Venice (ẩn danh)
openclaw agent --model venice/claude-opus-4-6 --message "Tóm tắt tác vụ này"

# Mô hình không kiểm duyệt
openclaw agent --model venice/venice-uncensored-1-2 --message "Soạn thảo các phương án"

# Mô hình thị giác có hình ảnh
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Đánh giá hình ảnh đính kèm"

# Mô hình lập trình
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "Tái cấu trúc hàm này"
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Khóa API không được nhận dạng">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Xác nhận khóa bắt đầu bằng `vapi_`.

  </Accordion>

  <Accordion title="Mô hình không khả dụng">
    Chạy `openclaw models list --all --provider venice` để xem các mô hình hiện
    có; danh mục thay đổi khi Venice thêm hoặc ngừng cung cấp mô hình.
  </Accordion>

  <Accordion title="Sự cố kết nối">
    API Venice nằm tại `https://api.venice.ai/api/v1`. Xác nhận mạng của bạn cho phép HTTPS tới máy chủ đó.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ví dụ tệp cấu hình">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và cơ chế chuyển đổi dự phòng.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Trang chủ Venice AI và đăng ký tài khoản.
  </Card>
  <Card title="Tài liệu API" href="https://docs.venice.ai" icon="book">
    Tài liệu tham khảo API Venice và tài liệu dành cho nhà phát triển.
  </Card>
  <Card title="Bảng giá" href="https://venice.ai/pricing" icon="credit-card">
    Mức tín dụng và các gói hiện tại của Venice.
  </Card>
</CardGroup>
