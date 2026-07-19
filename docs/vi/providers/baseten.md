---
read_when:
    - Bạn muốn chạy Inkling của Thinking Machines Lab trong OpenClaw
    - Bạn muốn một API tương thích với OpenAI cho các mô hình được lưu trữ trên Baseten
summary: Thiết lập Baseten cho Inkling và các API mô hình được lưu trữ
title: Baseten
x-i18n:
    generated_at: "2026-07-19T05:55:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5b4a8358141188171cb0b67510ec6bea1bb80dcab9c0c6da9a37aeb97560089
    source_path: providers/baseten.md
    workflow: 16
---

[API Mô hình Baseten](https://docs.baseten.co/inference/model-apis/overview) cung cấp quyền truy cập được lưu trữ, tương thích với OpenAI vào các mô hình tiên tiến. Plugin bên ngoài chính thức sử dụng cơ chế khám phá có xác thực, vì vậy OpenClaw sử dụng toàn bộ tập hợp mô hình được bật cho tài khoản Baseten của bạn. Phương án dự phòng ngoại tuyến của Plugin chứa mọi API Mô hình có sẵn tại thời điểm bản phát hành OpenClaw này được xây dựng.

| Thuộc tính       | Giá trị                                                  |
| ---------------- | -------------------------------------------------------- |
| ID nhà cung cấp  | `baseten`                                       |
| Plugin           | gói bên ngoài chính thức (`@openclaw/baseten-provider`)            |
| Biến môi trường xác thực | `BASETEN_API_KEY`                               |
| Cờ thiết lập ban đầu | `--auth-choice baseten-api-key`                                   |
| Cờ CLI trực tiếp | `--baseten-api-key <key>`                                       |
| API              | tương thích với OpenAI (`openai-completions`)              |
| URL cơ sở        | `https://inference.baseten.co/v1`                                       |
| Mô hình mặc định | `baseten/thinkingmachines/inkling`                                       |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/baseten-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản Baseten và khóa API">
    Gói Basic của Baseten không có phí nền tảng hằng tháng; các lệnh gọi API Mô hình được tính phí theo mức sử dụng. Tạo khóa trong [phần cài đặt khóa API Baseten](https://app.baseten.co/settings/api_keys) và kiểm tra mức giá hiện tại trên [trang giá](https://www.baseten.co/pricing).
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice baseten-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice baseten-api-key \
  --baseten-api-key "$BASETEN_API_KEY"
```

```bash Chỉ dùng biến môi trường
export BASETEN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh danh mục trực tiếp">
    ```bash
    openclaw models list --provider baseten
    ```

    Khi có thông tin xác thực hợp lệ, Plugin yêu cầu `GET /v1/models` và liệt kê mọi mô hình được trả về cho tài khoản. Khi không có thông tin xác thực, Plugin vẫn ở chế độ ngoại tuyến và sử dụng phương án dự phòng đi kèm.

  </Step>
</Steps>

## Inkling

[Inkling của Thinking Machines Lab](https://thinkingmachines.ai/news/introducing-inkling/) là mô hình mặc định. Trong OpenClaw, mô hình này hỗ trợ đầu vào văn bản và hình ảnh, gọi công cụ, lược đồ công cụ có cấu trúc, mức độ suy luận có thể cấu hình, cửa sổ ngữ cảnh 1.048M token và tối đa 32k token đầu ra:

```json5
{
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
}
```

Sử dụng `/model baseten/thinkingmachines/inkling` để chuyển đổi một cuộc trò chuyện hiện có.

## Danh mục dự phòng đi kèm

Danh mục trực tiếp đã xác thực là nguồn có thẩm quyền. Các hàng này giúp quy trình thiết lập và lựa chọn mô hình vẫn hữu ích trước khi quá trình khám phá thành công:

| Tham chiếu mô hình                                 | Đầu vào         | Ngữ cảnh | Đầu ra tối đa |
| -------------------------------------------------- | --------------- | -------: | ------------: |
| `baseten/deepseek-ai/DeepSeek-V4-Pro`                                 | văn bản         |     262k |          262k |
| `baseten/zai-org/GLM-4.7`                                 | văn bản         |     200k |          200k |
| `baseten/zai-org/GLM-5`                                 | văn bản         |     202k |          202k |
| `baseten/zai-org/GLM-5.1`                                 | văn bản         |     202k |          202k |
| `baseten/zai-org/GLM-5.2`                                 | văn bản         |     202k |          202k |
| `baseten/thinkingmachines/inkling`                                 | văn bản, hình ảnh |  1.048M |           32k |
| `baseten/moonshotai/Kimi-K2.5`                                 | văn bản, hình ảnh |    262k |          262k |
| `baseten/moonshotai/Kimi-K2.6`                                 | văn bản, hình ảnh |    262k |          262k |
| `baseten/moonshotai/Kimi-K2.7-Code`                                 | văn bản, hình ảnh |    262k |          262k |
| `baseten/nvidia/Nemotron-120B-A12B`                                 | văn bản         |     202k |          202k |
| `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B`                                 | văn bản         |     202k |          202k |
| `baseten/openai/gpt-oss-120b`                                 | văn bản         |     128k |          128k |

Tất cả mô hình đi kèm đều hỗ trợ gọi công cụ và suy luận. OpenClaw ánh xạ các cấp độ tư duy của mình sang những mô hình có `reasoning_effort` gốc. Các mô hình GLM, Kimi và Nemotron cần chủ động bật của Baseten mặc định tắt chế độ tư duy; phần lớn cung cấp chế độ điều khiển nhị phân tắt/bật, còn GLM 5.2 cung cấp các mức tắt, cao và tối đa. OpenClaw gửi các lựa chọn này qua cơ chế điều khiển `chat_template_args.enable_thinking` của Baseten và, đối với GLM 5.2, qua tham số cấp cao nhất `reasoning_effort` đã được xác thực.

<Note>
Baseten có thể thêm, xóa hoặc thay đổi các API Mô hình độc lập với các bản phát hành OpenClaw. Plugin làm mới ID mô hình, giới hạn ngữ cảnh, giới hạn đầu ra và giá của đầu vào, đầu vào được lưu vào bộ nhớ đệm và đầu ra từ API đã xác thực, đồng thời giữ nguyên chính sách truyền tải riêng theo từng mô hình của OpenClaw.
</Note>

## Cấu hình thủ công

Hầu hết quy trình thiết lập chỉ cần khóa API. Để chỉ định rõ nhà cung cấp:

```json5
{
  env: { BASETEN_API_KEY: "..." },
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      baseten: {
        baseUrl: "https://inference.baseten.co/v1",
        apiKey: "${BASETEN_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "thinkingmachines/inkling",
            name: "Inkling",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048000,
            maxTokens: 32000,
            compat: {
              supportsStore: false,
              supportsDeveloperRole: false,
              supportsUsageInStreaming: true,
              supportsStrictMode: true,
              supportsTools: true,
              supportsReasoningEffort: true,
              supportedReasoningEfforts: ["none", "minimal", "low", "medium", "high", "xhigh"],
              reasoningEffortMap: {
                off: "none",
                none: "none",
                adaptive: "xhigh",
                max: "xhigh",
              },
              maxTokensField: "max_tokens",
            },
          },
        ],
      },
    },
  },
}
```

<Note>
Nếu Gateway chạy dưới dạng daemon (launchd, systemd, Docker), hãy đảm bảo `BASETEN_API_KEY` khả dụng cho tiến trình đó. Khóa chỉ được xuất trong một shell tương tác sẽ không hiển thị với dịch vụ được quản lý đang chạy.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Lựa chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Chế độ tư duy" href="/vi/tools/thinking" icon="brain">
    Chọn các mức độ suy luận của OpenClaw.
  </Card>
  <Card title="CLI mô hình" href="/vi/cli/models" icon="terminal">
    Liệt kê, kiểm tra và chọn các mô hình đã được khám phá.
  </Card>
  <Card title="Câu hỏi thường gặp về mô hình" href="/vi/help/faq-models" icon="circle-question">
    Khắc phục sự cố về hồ sơ xác thực và lựa chọn mô hình.
  </Card>
</CardGroup>
