---
read_when:
    - Bạn muốn sử dụng Hugging Face Inference với OpenClaw
    - Bạn cần biến môi trường chứa token HF hoặc tùy chọn xác thực CLI
summary: Thiết lập Hugging Face Inference (xác thực + lựa chọn mô hình)
title: Hugging Face (suy luận)
x-i18n:
    generated_at: "2026-07-12T08:20:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Các Nhà cung cấp Suy luận của Hugging Face](https://huggingface.co/docs/inference-providers) cung cấp một bộ định tuyến hoàn tất trò chuyện tương thích với OpenAI cho nhiều mô hình được lưu trữ (DeepSeek, Llama và nhiều mô hình khác) chỉ với một mã thông báo. OpenClaw chỉ giao tiếp với **điểm cuối hoàn tất trò chuyện**; đối với chuyển văn bản thành hình ảnh, embedding hoặc giọng nói, hãy sử dụng trực tiếp [các ứng dụng khách suy luận HF](https://huggingface.co/docs/api-inference/quicktour).

| Thuộc tính               | Giá trị                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| ID nhà cung cấp          | `huggingface`                                                                                                                        |
| Plugin                   | đi kèm (được bật theo mặc định, không cần bước cài đặt)                                                                              |
| Biến môi trường xác thực | `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` (mã thông báo có phạm vi chi tiết)                                                           |
| API                      | tương thích với OpenAI (`https://router.huggingface.co/v1`)                                                                          |
| Thanh toán               | Một mã thông báo HF; [mức giá](https://huggingface.co/docs/inference-providers/pricing) tuân theo mức phí của nhà cung cấp và có gói miễn phí |

## Bắt đầu

<Steps>
  <Step title="Tạo mã thông báo có phạm vi chi tiết">
    Truy cập [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) và tạo một mã thông báo mới có phạm vi chi tiết.

    <Warning>
    Mã thông báo phải được bật quyền **Make calls to Inference Providers**, nếu không các yêu cầu API sẽ bị từ chối.
    </Warning>

  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    Chọn **Hugging Face** trong danh sách thả xuống nhà cung cấp, sau đó nhập khóa API khi được nhắc:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Chọn mô hình mặc định">
    Trong danh sách thả xuống **Mô hình Hugging Face mặc định**, hãy chọn một mô hình. Danh sách được tải từ Inference API khi mã thông báo của bạn hợp lệ; nếu không, OpenClaw sẽ hiển thị danh mục tích hợp bên dưới. Lựa chọn của bạn được lưu vào `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Thiết lập không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Đặt `huggingface/deepseek-ai/DeepSeek-R1` làm mô hình mặc định.

## ID mô hình

Tham chiếu mô hình có dạng `huggingface/<org>/<model>` (ID theo kiểu Hub). Danh mục tích hợp của OpenClaw:

| Mô hình                      | Tham chiếu (thêm tiền tố `huggingface/`)    |
| ---------------------------- | ------------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                   |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                 |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                       |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`   |

<Tip>
Khi mã thông báo của bạn hợp lệ, OpenClaw cũng khám phá mọi mô hình khác thông qua **GET** `https://router.huggingface.co/v1/models` trong quá trình thiết lập ban đầu và khi Gateway khởi động, vì vậy danh mục của bạn có thể chứa nhiều hơn đáng kể so với bốn mô hình trên. Bạn có thể thêm `:fastest` hoặc `:cheapest` vào bất kỳ ID mô hình nào; bộ định tuyến của HF sẽ định tuyến đến nhà cung cấp suy luận phù hợp. Đặt thứ tự nhà cung cấp mặc định trong [cài đặt Nhà cung cấp Suy luận](https://hf.co/settings/inference-providers).
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Khám phá mô hình và danh sách thả xuống khi thiết lập ban đầu">
    OpenClaw khám phá các mô hình bằng:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # hoặc $HF_TOKEN
    ```

    Phản hồi có kiểu OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Khi đã cấu hình khóa (qua quy trình thiết lập ban đầu, `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`), danh sách thả xuống **Mô hình Hugging Face mặc định** trong quá trình thiết lập tương tác sẽ được điền từ điểm cuối này. Khi Gateway khởi động, lệnh gọi tương tự được thực hiện lại để làm mới danh mục. Các mô hình được khám phá sẽ được hợp nhất với danh mục tích hợp ở trên (được dùng cho siêu dữ liệu như cửa sổ ngữ cảnh và chi phí khi ID trùng khớp). Nếu yêu cầu thất bại, không trả về dữ liệu hoặc chưa đặt khóa, OpenClaw chỉ quay về sử dụng danh mục tích hợp.

    Tắt tính năng khám phá mà không xóa nhà cung cấp:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Tên mô hình, bí danh và hậu tố chính sách">
    - **Tên từ API:** các mô hình được khám phá sử dụng `name`, `title` hoặc `display_name` từ API khi có; nếu không, OpenClaw sẽ tạo tên từ ID mô hình (ví dụ: `deepseek-ai/DeepSeek-R1` trở thành "DeepSeek R1").
    - **Ghi đè tên hiển thị:** đặt nhãn tùy chỉnh cho từng mô hình trong cấu hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Hậu tố chính sách:** `:fastest` và `:cheapest` là quy ước của bộ định tuyến HF, không phải nội dung được OpenClaw ghi lại: hậu tố được gửi nguyên văn như một phần của ID mô hình và bộ định tuyến của HF chọn nhà cung cấp suy luận phù hợp. Thêm từng biến thể thành một mục riêng trong `models.providers.huggingface.models` (hoặc trong `model.primary`) nếu bạn muốn mỗi hậu tố có một bí danh riêng.
    - **Hợp nhất cấu hình:** các mục hiện có trong `models.providers.huggingface.models` (ví dụ: trong `models.json`) được giữ lại khi hợp nhất cấu hình, vì vậy mọi `name`, `alias` hoặc tùy chọn mô hình tùy chỉnh mà bạn đặt tại đó sẽ tồn tại qua các lần khởi động lại.

  </Accordion>

  <Accordion title="Thiết lập môi trường và tiến trình nền">
    Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy bảo đảm `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` khả dụng cho tiến trình đó (ví dụ: trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

    <Note>
    OpenClaw chấp nhận cả `HUGGINGFACE_HUB_TOKEN` và `HF_TOKEN`. Nếu cả hai đều được đặt, `HUGGINGFACE_HUB_TOKEN` được ưu tiên.
    </Note>

  </Accordion>

  <Accordion title="Cấu hình: DeepSeek R1 với mô hình dự phòng">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Cấu hình: DeepSeek với các biến thể rẻ nhất và nhanh nhất">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Cấu hình: DeepSeek + Llama + GPT-OSS với bí danh">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
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
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
  <Card title="Tài liệu về Nhà cung cấp Suy luận" href="https://huggingface.co/docs/inference-providers" icon="book">
    Tài liệu chính thức về Nhà cung cấp Suy luận của Hugging Face.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Tài liệu tham chiếu cấu hình đầy đủ.
  </Card>
</CardGroup>
