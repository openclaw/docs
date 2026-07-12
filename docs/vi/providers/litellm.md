---
read_when:
    - Bạn muốn định tuyến OpenClaw qua proxy LiteLLM
    - Bạn cần theo dõi chi phí, ghi nhật ký hoặc định tuyến mô hình thông qua LiteLLM
summary: Chạy OpenClaw thông qua LiteLLM Proxy để truy cập mô hình hợp nhất và theo dõi chi phí
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T08:16:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) là một gateway LLM mã nguồn mở với API hợp nhất cho hơn 100 nhà cung cấp
mô hình. Định tuyến OpenClaw qua LiteLLM để theo dõi chi phí tập trung, ghi nhật ký, sử dụng khóa ảo có
giới hạn chi tiêu và chuyển đổi dự phòng phần phụ trợ mà không cần thay đổi cấu hình OpenClaw.

## Bắt đầu nhanh

<Tabs>
  <Tab title="Thiết lập ban đầu (khuyến nghị)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Để thiết lập không tương tác với một proxy từ xa, hãy truyền rõ URL của proxy:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Thiết lập thủ công">
    <Steps>
      <Step title="Khởi động LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Kết nối OpenClaw với LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Cấu hình

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

Mô hình mặc định được quy trình thiết lập ban đầu ghi vào là `litellm/claude-opus-4-6`.

## Tạo hình ảnh

LiteLLM có thể cung cấp phần phụ trợ cho công cụ `image_generate` thông qua các tuyến
`/images/generations` và `/images/edits` tương thích với OpenAI. Mô hình hình ảnh mặc định là
`gpt-image-2`; để cấu hình mô hình khác, hãy đặt tại `agents.defaults.imageGenerationModel`:

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

Các URL local loopback của LiteLLM (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`)
hoạt động mà không cần ghi đè mạng riêng ở cấp toàn cục. Đối với proxy được lưu trữ trên mạng LAN, hãy đặt
`models.providers.litellm.request.allowPrivateNetwork: true` vì khóa API được gửi đến máy chủ đó.

## Nâng cao

<AccordionGroup>
  <Accordion title="Khóa ảo">
    Tạo một khóa chuyên dụng cho OpenClaw với giới hạn chi tiêu:

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

    Sử dụng khóa được tạo làm `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Định tuyến mô hình">
    LiteLLM có thể định tuyến yêu cầu mô hình đến các phần phụ trợ khác nhau. Hãy cấu hình trong tệp
    `config.yaml` của LiteLLM:

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

    OpenClaw tiếp tục yêu cầu `claude-opus-4-6`; LiteLLM xử lý việc định tuyến.

  </Accordion>

  <Accordion title="Xem mức sử dụng">
    ```bash
    # Thông tin khóa
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Nhật ký chi tiêu
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Lưu ý về hành vi của proxy">
    - Theo mặc định, LiteLLM chạy tại `http://localhost:4000`.
    - OpenClaw kết nối qua điểm cuối `/v1` tương thích với OpenAI theo kiểu proxy của LiteLLM.
    - Việc định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng khi sử dụng URL cơ sở LiteLLM đã cấu hình:
      không có `service_tier`, không có `store` của Responses, không có gợi ý bộ nhớ đệm lời nhắc và không
      định hình tải trọng mức độ suy luận của OpenAI.
    - Các tiêu đề ghi nguồn OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được gửi đến
      các điểm cuối OpenAI gốc đã xác minh, vì vậy chúng không được chèn khi dùng URL cơ sở LiteLLM tùy chỉnh.
  </Accordion>
</AccordionGroup>

<Note>
Để biết cấu hình chung cho nhà cung cấp và hành vi chuyển đổi dự phòng, hãy xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu LiteLLM" href="https://docs.litellm.ai" icon="book">
    Tài liệu LiteLLM chính thức và tài liệu tham chiếu API.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
  <Card title="Mô hình" href="/vi/concepts/models" icon="brain">
    Cách lựa chọn và cấu hình mô hình.
  </Card>
</CardGroup>
