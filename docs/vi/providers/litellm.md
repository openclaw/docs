---
read_when:
    - Bạn muốn định tuyến OpenClaw qua proxy LiteLLM
    - Bạn cần theo dõi chi phí, ghi nhật ký hoặc định tuyến mô hình thông qua LiteLLM
summary: Chạy OpenClaw thông qua LiteLLM Proxy để truy cập mô hình thống nhất và theo dõi chi phí
title: LiteLLM
x-i18n:
    generated_at: "2026-04-29T23:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) là một LLM Gateway mã nguồn mở cung cấp một API thống nhất cho hơn 100 nhà cung cấp mô hình. Định tuyến OpenClaw qua LiteLLM để có theo dõi chi phí tập trung, ghi log và khả năng linh hoạt chuyển backend mà không cần thay đổi cấu hình OpenClaw của bạn.

<Tip>
**Tại sao dùng LiteLLM với OpenClaw?**

- **Theo dõi chi phí** — Xem chính xác OpenClaw chi tiêu bao nhiêu trên tất cả mô hình
- **Định tuyến mô hình** — Chuyển giữa Claude, GPT-4, Gemini, Bedrock mà không cần thay đổi cấu hình
- **Khóa ảo** — Tạo khóa có giới hạn chi tiêu cho OpenClaw
- **Ghi log** — Log đầy đủ request/response để gỡ lỗi
- **Dự phòng** — Tự động chuyển dự phòng nếu nhà cung cấp chính của bạn ngừng hoạt động

</Tip>

## Bắt đầu nhanh

<Tabs>
  <Tab title="Thiết lập ban đầu (khuyến nghị)">
    **Phù hợp nhất cho:** đường đi nhanh nhất để có một thiết lập LiteLLM hoạt động.

    <Steps>
      <Step title="Chạy thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Để thiết lập không tương tác với một proxy từ xa, hãy truyền URL proxy rõ ràng:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Thiết lập thủ công">
    **Phù hợp nhất cho:** toàn quyền kiểm soát cài đặt và cấu hình.

    <Steps>
      <Step title="Khởi động LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Trỏ OpenClaw đến LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Vậy là xong. OpenClaw giờ sẽ định tuyến qua LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cấu hình

### Biến môi trường

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Tệp cấu hình

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Cấu hình nâng cao

### Tạo hình ảnh

LiteLLM cũng có thể hỗ trợ công cụ `image_generate` thông qua các route tương thích OpenAI
`/images/generations` và `/images/edits`. Cấu hình một mô hình hình ảnh LiteLLM
trong `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Các URL LiteLLM loopback như `http://localhost:4000` hoạt động mà không cần ghi đè
mạng riêng toàn cục. Với proxy được lưu trữ trên LAN, hãy đặt
`models.providers.litellm.request.allowPrivateNetwork: true` vì API key
sẽ được gửi đến máy chủ proxy đã cấu hình.

<AccordionGroup>
  <Accordion title="Khóa ảo">
    Tạo một khóa riêng cho OpenClaw với giới hạn chi tiêu:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Dùng khóa đã tạo làm `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Định tuyến mô hình">
    LiteLLM có thể định tuyến các yêu cầu mô hình đến những backend khác nhau. Cấu hình trong `config.yaml` LiteLLM của bạn:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw tiếp tục yêu cầu `claude-opus-4-6` — LiteLLM xử lý việc định tuyến.

  </Accordion>

  <Accordion title="Xem mức sử dụng">
    Kiểm tra bảng điều khiển hoặc API của LiteLLM:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Ghi chú về hành vi proxy">
    - LiteLLM mặc định chạy trên `http://localhost:4000`
    - OpenClaw kết nối qua endpoint `/v1` kiểu proxy tương thích OpenAI của LiteLLM
    - Việc định hình request chỉ dành cho OpenAI gốc không áp dụng qua LiteLLM:
      không có `service_tier`, không có Responses `store`, không có gợi ý prompt-cache và không có
      định hình payload tương thích reasoning của OpenAI
    - Các header ghi nhận nguồn OpenClaw ẩn (`originator`, `version`, `User-Agent`)
      không được chèn trên các URL cơ sở LiteLLM tùy chỉnh
  </Accordion>
</AccordionGroup>

<Note>
Để biết cấu hình nhà cung cấp chung và hành vi chuyển dự phòng, xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu LiteLLM" href="https://docs.litellm.ai" icon="book">
    Tài liệu LiteLLM chính thức và tài liệu tham chiếu API.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
</CardGroup>
