---
read_when:
    - Bạn muốn suy luận chú trọng quyền riêng tư trong OpenClaw
    - Bạn muốn hướng dẫn thiết lập Venice AI
summary: Sử dụng các mô hình tập trung vào quyền riêng tư của Venice AI trong OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-06-27T18:06:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI cung cấp **suy luận AI tập trung vào quyền riêng tư** với hỗ trợ cho các mô hình không kiểm duyệt và quyền truy cập vào các mô hình độc quyền lớn thông qua proxy ẩn danh của họ. Mọi suy luận đều riêng tư theo mặc định — không huấn luyện trên dữ liệu của bạn, không ghi nhật ký.

## Vì sao dùng Venice trong OpenClaw

- **Suy luận riêng tư** cho các mô hình nguồn mở (không ghi nhật ký).
- **Mô hình không kiểm duyệt** khi bạn cần.
- **Truy cập ẩn danh** vào các mô hình độc quyền (Opus/GPT/Gemini) khi chất lượng là yếu tố quan trọng.
- Endpoint `/v1` tương thích với OpenAI.

## Chế độ quyền riêng tư

Venice cung cấp hai mức quyền riêng tư — hiểu điều này là chìa khóa để chọn mô hình của bạn:

| Chế độ          | Mô tả                                                                                                                              | Mô hình                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Riêng tư**    | Hoàn toàn riêng tư. Prompt/phản hồi **không bao giờ được lưu trữ hoặc ghi nhật ký**. Tạm thời.                                    | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, v.v. |
| **Ẩn danh**     | Được proxy qua Venice với metadata đã bị loại bỏ. Nhà cung cấp bên dưới (OpenAI, Anthropic, Google, xAI) thấy các yêu cầu ẩn danh. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Các mô hình ẩn danh **không** hoàn toàn riêng tư. Venice loại bỏ metadata trước khi chuyển tiếp, nhưng nhà cung cấp bên dưới (OpenAI, Anthropic, Google, xAI) vẫn xử lý yêu cầu. Chọn mô hình **Riêng tư** khi cần quyền riêng tư hoàn toàn.
</Warning>

## Tính năng

- **Tập trung vào quyền riêng tư**: Chọn giữa chế độ "riêng tư" (hoàn toàn riêng tư) và "ẩn danh" (được proxy)
- **Mô hình không kiểm duyệt**: Truy cập các mô hình không có hạn chế nội dung
- **Truy cập mô hình lớn**: Dùng Claude, GPT, Gemini và Grok thông qua proxy ẩn danh của Venice
- **API tương thích với OpenAI**: Endpoint `/v1` tiêu chuẩn để tích hợp dễ dàng
- **Streaming**: Được hỗ trợ trên tất cả mô hình
- **Gọi hàm**: Được hỗ trợ trên một số mô hình chọn lọc (kiểm tra năng lực của mô hình)
- **Vision**: Được hỗ trợ trên các mô hình có năng lực vision
- **Không có giới hạn tốc độ cứng**: Có thể áp dụng điều tiết theo mức sử dụng hợp lý khi dùng cực lớn

## Bắt đầu

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Get your API key">
    1. Đăng ký tại [venice.ai](https://venice.ai)
    2. Vào **Settings > API Keys > Create new key**
    3. Sao chép khóa API của bạn (định dạng: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    Chọn phương thức thiết lập bạn muốn:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Lệnh này sẽ:
        1. Nhắc nhập khóa API của bạn (hoặc dùng `VENICE_API_KEY` hiện có)
        2. Hiển thị tất cả mô hình Venice có sẵn
        3. Cho phép bạn chọn mô hình mặc định
        4. Tự động cấu hình nhà cung cấp
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Chọn mô hình

Sau khi thiết lập, OpenClaw hiển thị tất cả mô hình Venice có sẵn. Chọn theo nhu cầu của bạn:

- **Mô hình mặc định**: `venice/kimi-k2-5` cho khả năng suy luận riêng tư mạnh cùng vision.
- **Tùy chọn năng lực cao**: `venice/claude-opus-4-6` cho tuyến Venice ẩn danh mạnh nhất.
- **Quyền riêng tư**: Chọn mô hình "riêng tư" để suy luận hoàn toàn riêng tư.
- **Năng lực**: Chọn mô hình "ẩn danh" để truy cập Claude, GPT, Gemini thông qua proxy của Venice.

Thay đổi mô hình mặc định của bạn bất cứ lúc nào:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Liệt kê tất cả mô hình có sẵn:

```bash
openclaw models list --all --provider venice
```

Bạn cũng có thể chạy `openclaw configure`, chọn **Model/auth**, rồi chọn **Venice AI**.

<Tip>
Dùng bảng bên dưới để chọn mô hình phù hợp cho trường hợp sử dụng của bạn.

| Trường hợp sử dụng             | Mô hình được khuyến nghị          | Lý do                                        |
| ------------------------------ | --------------------------------- | -------------------------------------------- |
| **Trò chuyện chung (mặc định)** | `kimi-k2-5`                       | Suy luận riêng tư mạnh cùng vision           |
| **Chất lượng tổng thể tốt nhất** | `claude-opus-4-6`                | Tùy chọn Venice ẩn danh mạnh nhất            |
| **Quyền riêng tư + lập trình**  | `qwen3-coder-480b-a35b-instruct` | Mô hình lập trình riêng tư với ngữ cảnh lớn  |
| **Vision riêng tư**             | `kimi-k2-5`                      | Hỗ trợ vision mà không rời chế độ riêng tư   |
| **Nhanh + rẻ**                  | `qwen3-4b`                       | Mô hình suy luận nhẹ                         |
| **Tác vụ riêng tư phức tạp**    | `deepseek-v3.2`                  | Suy luận mạnh, nhưng không hỗ trợ công cụ Venice |
| **Không kiểm duyệt**            | `venice-uncensored`              | Không có hạn chế nội dung                    |

</Tip>

## Hành vi phát lại DeepSeek V4

Nếu Venice cung cấp các mô hình DeepSeek V4 như `venice/deepseek-v4-pro` hoặc
`venice/deepseek-v4-flash`, OpenClaw điền placeholder phát lại
`reasoning_content` bắt buộc của DeepSeek V4 trên tin nhắn assistant khi proxy
bỏ qua nó. Venice từ chối điều khiển `thinking` cấp cao nhất gốc của DeepSeek, vì vậy
OpenClaw giữ bản sửa phát lại riêng theo nhà cung cấp đó tách biệt khỏi các điều khiển thinking
của nhà cung cấp DeepSeek gốc.

## Catalog tích hợp sẵn (tổng cộng 41)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | ID mô hình                             | Tên                                 | Ngữ cảnh | Tính năng                  |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Mặc định, suy luận, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Suy luận                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Chung                      |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Chung                      |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k     | Chung, công cụ bị tắt      |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k     | Suy luận                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k     | Chung                      |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k     | Lập trình                  |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k     | Lập trình                  |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k     | Suy luận, vision           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k     | Chung                      |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k     | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k      | Nhanh, suy luận            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k     | Suy luận, công cụ bị tắt   |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Không kiểm duyệt, công cụ bị tắt |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k     | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k     | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k     | Chung                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k     | Chung                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k     | Suy luận                   |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k     | Chung                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k     | Suy luận                   |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k     | Suy luận                   |
    | `zai-org-glm-5`                        | GLM 5                              | 198k     | Suy luận                   |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k     | Suy luận                   |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k     | Suy luận                   |
  </Accordion>

  <Accordion title="Anonymized models (12) — via Venice proxy">
    | ID mô hình                      | Tên                            | Ngữ cảnh | Tính năng                 |
    | ------------------------------- | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (qua Venice)   | 1M       | Suy luận, vision          |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (qua Venice) | 1M       | Suy luận, vision          |
    | `openai-gpt-54`                 | GPT-5.4 (qua Venice)           | 1M       | Suy luận, vision          |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (qua Venice)     | 400k     | Suy luận, vision, lập trình |
    | `openai-gpt-52`                 | GPT-5.2 (qua Venice)           | 256k     | Suy luận                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (qua Venice)     | 256k     | Suy luận, vision, lập trình |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (qua Venice)            | 128k     | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (qua Venice)       | 128k     | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (qua Venice)    | 1M       | Suy luận, vision          |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (qua Venice)      | 198k     | Suy luận, vision          |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (qua Venice)    | 256k     | Suy luận, vision          |
    | `grok-41-fast`                  | Grok 4.1 Fast (qua Venice)     | 1M       | Suy luận, vision          |
  </Accordion>
</AccordionGroup>

## Khám phá mô hình

OpenClaw phát hành catalog seed Venice dựa trên manifest để liệt kê mô hình chỉ đọc. Việc làm mới runtime vẫn có thể khám phá mô hình từ API Venice, và sẽ quay về catalog manifest nếu API không truy cập được.

Endpoint `/models` là công khai (không cần xác thực để liệt kê), nhưng suy luận yêu cầu khóa API hợp lệ.

## Streaming và hỗ trợ công cụ

| Tính năng            | Hỗ trợ                                               |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Tất cả mô hình                                      |
| **Gọi hàm**          | Hầu hết mô hình (kiểm tra `supportsFunctionCalling` trong API) |
| **Vision/Hình ảnh**  | Các mô hình được đánh dấu bằng tính năng "Vision"    |
| **Chế độ JSON**      | Được hỗ trợ qua `response_format`                    |

## Giá

Venice sử dụng hệ thống dựa trên tín dụng. Kiểm tra [venice.ai/pricing](https://venice.ai/pricing) để xem mức giá hiện tại:

- **Mô hình riêng tư**: Thường có chi phí thấp hơn
- **Mô hình ẩn danh**: Tương tự giá API trực tiếp + một khoản phí nhỏ của Venice

### Venice (ẩn danh) so với API trực tiếp

| Khía cạnh    | Venice (Ẩn danh)              | API trực tiếp       |
| ------------ | ----------------------------- | ------------------- |
| **Quyền riêng tư** | Siêu dữ liệu bị loại bỏ, ẩn danh | Tài khoản của bạn được liên kết |
| **Độ trễ**   | +10-50ms (proxy)              | Trực tiếp           |
| **Tính năng** | Hầu hết tính năng được hỗ trợ | Đầy đủ tính năng    |
| **Thanh toán** | Tín dụng Venice              | Thanh toán của nhà cung cấp |

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
  <Accordion title="Khóa API không được nhận diện">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Đảm bảo khóa bắt đầu bằng `vapi_`.

  </Accordion>

  <Accordion title="Mô hình không khả dụng">
    Danh mục mô hình Venice được cập nhật động. Chạy `openclaw models list` để xem các mô hình hiện có. Một số mô hình có thể tạm thời ngoại tuyến.
  </Accordion>

  <Accordion title="Sự cố kết nối">
    Venice API ở `https://api.venice.ai/api/v1`. Đảm bảo mạng của bạn cho phép kết nối HTTPS.
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
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Trang chủ Venice AI và đăng ký tài khoản.
  </Card>
  <Card title="Tài liệu API" href="https://docs.venice.ai" icon="book">
    Tài liệu tham khảo Venice API và tài liệu dành cho nhà phát triển.
  </Card>
  <Card title="Giá" href="https://venice.ai/pricing" icon="credit-card">
    Mức tín dụng và các gói Venice hiện tại.
  </Card>
</CardGroup>
