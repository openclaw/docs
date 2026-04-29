---
read_when:
    - Bạn muốn suy luận chú trọng quyền riêng tư trong OpenClaw
    - Bạn muốn hướng dẫn thiết lập Venice AI
summary: Sử dụng các mô hình chú trọng quyền riêng tư của Venice AI trong OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-29T23:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI cung cấp **suy luận AI tập trung vào quyền riêng tư** với hỗ trợ các mô hình không kiểm duyệt và quyền truy cập vào các mô hình độc quyền lớn thông qua proxy ẩn danh của họ. Mọi suy luận đều riêng tư theo mặc định — không huấn luyện trên dữ liệu của bạn, không ghi nhật ký.

## Vì sao dùng Venice trong OpenClaw

- **Suy luận riêng tư** cho các mô hình mã nguồn mở (không ghi nhật ký).
- **Mô hình không kiểm duyệt** khi bạn cần.
- **Quyền truy cập ẩn danh** vào các mô hình độc quyền (Opus/GPT/Gemini) khi chất lượng là yếu tố quan trọng.
- Endpoint `/v1` tương thích OpenAI.

## Chế độ quyền riêng tư

Venice cung cấp hai mức quyền riêng tư — hiểu rõ điều này là chìa khóa để chọn mô hình của bạn:

| Chế độ          | Mô tả                                                                                                                               | Mô hình                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Riêng tư**    | Hoàn toàn riêng tư. Prompt/phản hồi **không bao giờ được lưu trữ hoặc ghi nhật ký**. Tạm thời.                                     | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, v.v. |
| **Ẩn danh**     | Được proxy qua Venice với siêu dữ liệu bị loại bỏ. Nhà cung cấp nền tảng (OpenAI, Anthropic, Google, xAI) thấy các yêu cầu ẩn danh. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Các mô hình ẩn danh **không** hoàn toàn riêng tư. Venice loại bỏ siêu dữ liệu trước khi chuyển tiếp, nhưng nhà cung cấp nền tảng (OpenAI, Anthropic, Google, xAI) vẫn xử lý yêu cầu. Chọn mô hình **Riêng tư** khi cần quyền riêng tư đầy đủ.
</Warning>

## Tính năng

- **Tập trung vào quyền riêng tư**: Chọn giữa chế độ "riêng tư" (hoàn toàn riêng tư) và "ẩn danh" (qua proxy)
- **Mô hình không kiểm duyệt**: Truy cập các mô hình không có hạn chế nội dung
- **Truy cập mô hình lớn**: Dùng Claude, GPT, Gemini và Grok qua proxy ẩn danh của Venice
- **API tương thích OpenAI**: Endpoint `/v1` tiêu chuẩn để tích hợp dễ dàng
- **Streaming**: Được hỗ trợ trên mọi mô hình
- **Gọi hàm**: Được hỗ trợ trên một số mô hình (kiểm tra năng lực mô hình)
- **Thị giác**: Được hỗ trợ trên các mô hình có năng lực thị giác
- **Không có giới hạn tốc độ cứng**: Có thể áp dụng điều tiết sử dụng hợp lý cho mức sử dụng cực đoan

## Bắt đầu

<Steps>
  <Step title="Lấy API key của bạn">
    1. Đăng ký tại [venice.ai](https://venice.ai)
    2. Đi tới **Settings > API Keys > Create new key**
    3. Sao chép API key của bạn (định dạng: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Cấu hình OpenClaw">
    Chọn phương thức thiết lập bạn muốn:

    <Tabs>
      <Tab title="Tương tác (khuyến nghị)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Thao tác này sẽ:
        1. Hỏi API key của bạn (hoặc dùng `VENICE_API_KEY` hiện có)
        2. Hiển thị mọi mô hình Venice có sẵn
        3. Cho phép bạn chọn mô hình mặc định
        4. Tự động cấu hình nhà cung cấp
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
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Chọn mô hình

Sau khi thiết lập, OpenClaw hiển thị mọi mô hình Venice có sẵn. Chọn dựa trên nhu cầu của bạn:

- **Mô hình mặc định**: `venice/kimi-k2-5` để có suy luận riêng tư mạnh cùng thị giác.
- **Tùy chọn năng lực cao**: `venice/claude-opus-4-6` cho đường dẫn Venice ẩn danh mạnh nhất.
- **Quyền riêng tư**: Chọn mô hình "riêng tư" để suy luận hoàn toàn riêng tư.
- **Năng lực**: Chọn mô hình "ẩn danh" để truy cập Claude, GPT, Gemini qua proxy của Venice.

Thay đổi mô hình mặc định của bạn bất cứ lúc nào:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Liệt kê mọi mô hình có sẵn:

```bash
openclaw models list | grep venice
```

Bạn cũng có thể chạy `openclaw configure`, chọn **Model/auth**, rồi chọn **Venice AI**.

<Tip>
Dùng bảng bên dưới để chọn mô hình phù hợp với trường hợp sử dụng của bạn.

| Trường hợp sử dụng             | Mô hình được khuyến nghị          | Lý do                                      |
| ------------------------------ | --------------------------------- | ----------------------------------------- |
| **Trò chuyện chung (mặc định)** | `kimi-k2-5`                       | Suy luận riêng tư mạnh cùng thị giác      |
| **Chất lượng tổng thể tốt nhất** | `claude-opus-4-6`                | Tùy chọn Venice ẩn danh mạnh nhất         |
| **Quyền riêng tư + lập trình**  | `qwen3-coder-480b-a35b-instruct` | Mô hình lập trình riêng tư với ngữ cảnh lớn |
| **Thị giác riêng tư**           | `kimi-k2-5`                       | Hỗ trợ thị giác mà không rời chế độ riêng tư |
| **Nhanh + rẻ**                  | `qwen3-4b`                        | Mô hình suy luận gọn nhẹ                  |
| **Tác vụ riêng tư phức tạp**    | `deepseek-v3.2`                   | Suy luận mạnh, nhưng không hỗ trợ công cụ Venice |
| **Không kiểm duyệt**            | `venice-uncensored`               | Không có hạn chế nội dung                 |

</Tip>

## Hành vi phát lại DeepSeek V4

Nếu Venice cung cấp các mô hình DeepSeek V4 như `venice/deepseek-v4-pro` hoặc
`venice/deepseek-v4-flash`, OpenClaw điền placeholder phát lại DeepSeek V4
`reasoning_content` bắt buộc trên thông điệp assistant khi proxy
bỏ qua nó. Venice từ chối điều khiển `thinking` cấp cao gốc của DeepSeek, vì vậy
OpenClaw giữ phần sửa phát lại riêng cho nhà cung cấp đó tách biệt khỏi các
điều khiển thinking của nhà cung cấp DeepSeek gốc.

## Danh mục tích hợp sẵn (tổng cộng 41)

<AccordionGroup>
  <Accordion title="Mô hình riêng tư (26) — hoàn toàn riêng tư, không ghi nhật ký">
    | ID mô hình                              | Tên                                 | Ngữ cảnh | Tính năng                         |
    | --------------------------------------- | ----------------------------------- | -------- | --------------------------------- |
    | `kimi-k2-5`                             | Kimi K2.5                           | 256k     | Mặc định, suy luận, thị giác      |
    | `kimi-k2-thinking`                      | Kimi K2 Thinking                    | 256k     | Suy luận                          |
    | `llama-3.3-70b`                         | Llama 3.3 70B                       | 128k     | Chung                             |
    | `llama-3.2-3b`                          | Llama 3.2 3B                        | 128k     | Chung                             |
    | `hermes-3-llama-3.1-405b`               | Hermes 3 Llama 3.1 405B            | 128k     | Chung, đã tắt công cụ             |
    | `qwen3-235b-a22b-thinking-2507`         | Qwen3 235B Thinking                 | 128k     | Suy luận                          |
    | `qwen3-235b-a22b-instruct-2507`         | Qwen3 235B Instruct                 | 128k     | Chung                             |
    | `qwen3-coder-480b-a35b-instruct`        | Qwen3 Coder 480B                    | 256k     | Lập trình                         |
    | `qwen3-coder-480b-a35b-instruct-turbo`  | Qwen3 Coder 480B Turbo              | 256k     | Lập trình                         |
    | `qwen3-5-35b-a3b`                       | Qwen3.5 35B A3B                     | 256k     | Suy luận, thị giác                |
    | `qwen3-next-80b`                        | Qwen3 Next 80B                      | 256k     | Chung                             |
    | `qwen3-vl-235b-a22b`                    | Qwen3 VL 235B (Vision)              | 256k     | Thị giác                          |
    | `qwen3-4b`                              | Venice Small (Qwen3 4B)             | 32k      | Nhanh, suy luận                   |
    | `deepseek-v3.2`                         | DeepSeek V3.2                       | 160k     | Suy luận, đã tắt công cụ          |
    | `venice-uncensored`                     | Venice Uncensored (Dolphin-Mistral) | 32k      | Không kiểm duyệt, đã tắt công cụ  |
    | `mistral-31-24b`                        | Venice Medium (Mistral)             | 128k     | Thị giác                          |
    | `google-gemma-3-27b-it`                 | Google Gemma 3 27B Instruct         | 198k     | Thị giác                          |
    | `openai-gpt-oss-120b`                   | OpenAI GPT OSS 120B                 | 128k     | Chung                             |
    | `nvidia-nemotron-3-nano-30b-a3b`        | NVIDIA Nemotron 3 Nano 30B          | 128k     | Chung                             |
    | `olafangensan-glm-4.7-flash-heretic`    | GLM 4.7 Flash Heretic               | 128k     | Suy luận                          |
    | `zai-org-glm-4.6`                       | GLM 4.6                             | 198k     | Chung                             |
    | `zai-org-glm-4.7`                       | GLM 4.7                             | 198k     | Suy luận                          |
    | `zai-org-glm-4.7-flash`                 | GLM 4.7 Flash                       | 128k     | Suy luận                          |
    | `zai-org-glm-5`                         | GLM 5                               | 198k     | Suy luận                          |
    | `minimax-m21`                           | MiniMax M2.1                        | 198k     | Suy luận                          |
    | `minimax-m25`                           | MiniMax M2.5                        | 198k     | Suy luận                          |
  </Accordion>

  <Accordion title="Mô hình ẩn danh (15) — qua proxy Venice">
    | ID mô hình                       | Tên                            | Ngữ cảnh | Tính năng                         |
    | -------------------------------- | ------------------------------ | -------- | --------------------------------- |
    | `claude-opus-4-6`                | Claude Opus 4.6 (via Venice)   | 1M       | Suy luận, thị giác                |
    | `claude-opus-4-5`                | Claude Opus 4.5 (via Venice)   | 198k     | Suy luận, thị giác                |
    | `claude-sonnet-4-6`              | Claude Sonnet 4.6 (via Venice) | 1M       | Suy luận, thị giác                |
    | `claude-sonnet-4-5`              | Claude Sonnet 4.5 (via Venice) | 198k     | Suy luận, thị giác                |
    | `openai-gpt-54`                  | GPT-5.4 (via Venice)           | 1M       | Suy luận, thị giác                |
    | `openai-gpt-53-codex`            | GPT-5.3 Codex (via Venice)     | 400k     | Suy luận, thị giác, lập trình     |
    | `openai-gpt-52`                  | GPT-5.2 (via Venice)           | 256k     | Suy luận                          |
    | `openai-gpt-52-codex`            | GPT-5.2 Codex (via Venice)     | 256k     | Suy luận, thị giác, lập trình     |
    | `openai-gpt-4o-2024-11-20`       | GPT-4o (via Venice)            | 128k     | Thị giác                          |
    | `openai-gpt-4o-mini-2024-07-18`  | GPT-4o Mini (via Venice)       | 128k     | Thị giác                          |
    | `gemini-3-1-pro-preview`         | Gemini 3.1 Pro (via Venice)    | 1M       | Suy luận, thị giác                |
    | `gemini-3-pro-preview`           | Gemini 3 Pro (via Venice)      | 198k     | Suy luận, thị giác                |
    | `gemini-3-flash-preview`         | Gemini 3 Flash (via Venice)    | 256k     | Suy luận, thị giác                |
    | `grok-41-fast`                   | Grok 4.1 Fast (via Venice)     | 1M       | Suy luận, thị giác                |
    | `grok-code-fast-1`               | Grok Code Fast 1 (via Venice)  | 256k     | Suy luận, lập trình               |
  </Accordion>
</AccordionGroup>

## Khám phá mô hình

OpenClaw tự động khám phá các mô hình từ API Venice khi `VENICE_API_KEY` được đặt. Nếu không truy cập được API, nó sẽ quay về danh mục tĩnh.

Endpoint `/models` là công khai (không cần xác thực để liệt kê), nhưng suy luận yêu cầu API key hợp lệ.

## Streaming và hỗ trợ công cụ

| Tính năng            | Hỗ trợ                                               |
| -------------------- | ---------------------------------------------------- |
| **Truyền phát**      | Tất cả mô hình                                      |
| **Gọi hàm**          | Hầu hết mô hình (kiểm tra `supportsFunctionCalling` trong API) |
| **Thị giác/Hình ảnh** | Các mô hình được đánh dấu bằng tính năng "Thị giác" |
| **Chế độ JSON**      | Được hỗ trợ qua `response_format`                   |

## Giá

Venice dùng hệ thống dựa trên tín dụng. Xem [venice.ai/pricing](https://venice.ai/pricing) để biết mức giá hiện tại:

- **Mô hình riêng tư**: Thường có chi phí thấp hơn
- **Mô hình ẩn danh hóa**: Tương tự giá API trực tiếp + một khoản phí nhỏ của Venice

### Venice (ẩn danh hóa) so với API trực tiếp

| Khía cạnh     | Venice (Ẩn danh hóa)           | API trực tiếp              |
| ------------ | ------------------------------ | -------------------------- |
| **Quyền riêng tư** | Siêu dữ liệu bị loại bỏ, được ẩn danh hóa | Tài khoản của bạn được liên kết |
| **Độ trễ**   | +10-50ms (proxy)               | Trực tiếp                  |
| **Tính năng** | Hỗ trợ hầu hết tính năng        | Đầy đủ tính năng           |
| **Thanh toán** | Tín dụng Venice                | Thanh toán qua nhà cung cấp |

## Ví dụ sử dụng

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Đảm bảo khóa bắt đầu bằng `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    Danh mục mô hình Venice được cập nhật động. Chạy `openclaw models list` để xem các mô hình hiện có. Một số mô hình có thể tạm thời ngoại tuyến.
  </Accordion>

  <Accordion title="Connection issues">
    API Venice ở `https://api.venice.ai/api/v1`. Đảm bảo mạng của bạn cho phép kết nối HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Trợ giúp thêm: [Khắc phục sự cố](/vi/help/troubleshooting) và [Câu hỏi thường gặp](/vi/help/faq).
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Trang chủ Venice AI và đăng ký tài khoản.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Tài liệu tham khảo API Venice và tài liệu dành cho nhà phát triển.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Mức tín dụng và gói Venice hiện tại.
  </Card>
</CardGroup>
