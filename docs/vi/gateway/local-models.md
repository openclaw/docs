---
read_when:
    - Bạn muốn cung cấp các mô hình từ máy chủ GPU của riêng mình
    - Bạn đang kết nối LM Studio hoặc một proxy tương thích với OpenAI
    - Bạn cần hướng dẫn về mô hình cục bộ an toàn nhất
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, các điểm cuối OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-07-12T07:55:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Các mô hình cục bộ có thể hoạt động, nhưng chúng đặt ra yêu cầu cao hơn về phần cứng, kích thước ngữ cảnh và khả năng phòng vệ trước chèn prompt: các mô hình nhỏ hoặc được lượng tử hóa mạnh sẽ cắt ngắn ngữ cảnh và bỏ qua các bộ lọc an toàn phía nhà cung cấp. Trang này trình bày các ngăn xếp cục bộ cao cấp hơn và các máy chủ tùy chỉnh tương thích với OpenAI. Để có lộ trình ít trở ngại nhất, hãy bắt đầu với [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`.

Đối với các máy chủ cục bộ chỉ nên khởi động khi mô hình được chọn cần đến chúng, hãy xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).

## Yêu cầu phần cứng tối thiểu

Hãy nhắm đến **ít nhất 2 máy Mac Studio cấu hình tối đa hoặc một hệ thống GPU tương đương (~30.000 USD trở lên)** để có vòng lặp tác nhân hoạt động thoải mái. Một GPU **24 GB** chỉ xử lý được các prompt nhẹ hơn với độ trễ cao hơn. Luôn chạy **biến thể lớn nhất / đầy đủ nhất mà hệ thống của bạn có thể lưu trú** - các checkpoint nhỏ hoặc được lượng tử hóa mạnh làm tăng rủi ro chèn prompt (xem [Bảo mật](/vi/gateway/security)).

## Chọn phần phụ trợ

| Phần phụ trợ                                         | Sử dụng khi                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [ds4](/vi/providers/ds4)                                | Chạy DeepSeek V4 Flash cục bộ trên macOS Metal với các lệnh gọi công cụ tương thích OpenAI                    |
| [LM Studio](/vi/providers/lmstudio)                     | Thiết lập cục bộ lần đầu, trình nạp có giao diện đồ họa, Responses API gốc                                   |
| LiteLLM / OAI-proxy / proxy tùy chỉnh tương thích OpenAI | Bạn đặt proxy phía trước một API mô hình khác và cần OpenClaw xử lý API đó như OpenAI                     |
| MLX / vLLM / SGLang                                  | Phục vụ tự lưu trú với thông lượng cao qua một điểm cuối HTTP tương thích OpenAI                              |
| [Ollama](/vi/providers/ollama)                          | Quy trình làm việc bằng CLI, thư viện mô hình, dịch vụ systemd không cần can thiệp                            |

Sử dụng `api: "openai-responses"` khi phần phụ trợ hỗ trợ tùy chọn này (LM Studio có hỗ trợ). Nếu không, hãy sử dụng `api: "openai-completions"`. Nếu bỏ qua `api` trên một nhà cung cấp tùy chỉnh có `baseUrl`, OpenClaw mặc định sử dụng `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** trình cài đặt Ollama chính thức cho Linux bật một dịch vụ systemd với `Restart=always`. Trên các hệ thống WSL2 dùng GPU, tính năng tự khởi động có thể tải lại mô hình gần nhất trong quá trình khởi động và chiếm giữ bộ nhớ máy chủ, khiến máy ảo liên tục khởi động lại. Xem [Vòng lặp sự cố WSL2](/vi/providers/ollama#troubleshooting).
</Warning>

## LM Studio + mô hình cục bộ lớn (Responses API)

Đây là ngăn xếp cục bộ tốt nhất hiện nay. Hãy tải một mô hình lớn trong LM Studio (bản dựng Qwen, DeepSeek hoặc Llama đầy đủ), bật máy chủ cục bộ (mặc định là `http://127.0.0.1:1234`) và sử dụng Responses API để tách phần suy luận khỏi văn bản cuối cùng.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Danh sách kiểm tra thiết lập:

- Cài đặt LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Tải xuống **bản dựng mô hình lớn nhất hiện có** (tránh các biến thể "nhỏ"/được lượng tử hóa mạnh), khởi động máy chủ và xác nhận `http://127.0.0.1:1234/v1/models` liệt kê mô hình đó.
- Thay `my-local-model` bằng mã định danh mô hình thực tế được hiển thị trong LM Studio.
- Giữ mô hình ở trạng thái đã tải; việc tải nguội làm tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn sử dụng các giá trị khác.
- Đối với WhatsApp, hãy tiếp tục sử dụng Responses API để chỉ văn bản cuối cùng được gửi đi.
- Giữ `models.mode: "merge"` để các mô hình được lưu trú vẫn có thể dùng làm phương án dự phòng.

### Cấu hình kết hợp: mô hình chính được lưu trú, mô hình cục bộ dự phòng

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Để ưu tiên mô hình cục bộ nhưng vẫn có mô hình được lưu trú làm lưới an toàn, hãy hoán đổi thứ tự `primary`/`fallbacks` và giữ nguyên khối `providers` cùng `models.mode: "merge"`.

### Lưu trú theo khu vực / định tuyến dữ liệu

Các biến thể MiniMax/Kimi/GLM được lưu trú cũng có trên OpenRouter với các điểm cuối cố định theo khu vực (ví dụ: được lưu trú tại Hoa Kỳ). Hãy chọn biến thể theo khu vực để giữ lưu lượng trong phạm vi tài phán bạn chọn, đồng thời duy trì `models.mode: "merge"` cho các phương án dự phòng Anthropic/OpenAI. Chỉ dùng mô hình cục bộ vẫn là phương án bảo vệ quyền riêng tư mạnh nhất; định tuyến lưu trú theo khu vực là lựa chọn trung gian khi bạn cần các tính năng của nhà cung cấp nhưng vẫn muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ khác tương thích OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy hoặc bất kỳ Gateway tùy chỉnh nào đều hoạt động nếu cung cấp điểm cuối `/v1/chat/completions` theo kiểu OpenAI. Sử dụng `openai-completions` trừ khi tài liệu của phần phụ trợ nêu rõ có hỗ trợ `/v1/responses`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Các mục nhà cung cấp tùy chỉnh/cục bộ tin cậy chính xác nguồn gốc `baseUrl` đã cấu hình cho các yêu cầu mô hình được bảo vệ, bao gồm local loopback, LAN, tailnet và các máy chủ DNS riêng. Các nguồn gốc siêu dữ liệu/link-local luôn bị chặn bất kể cấu hình. Yêu cầu đến các nguồn gốc riêng tư khác vẫn cần `models.providers.<id>.request.allowPrivateNetwork: true`; đặt cờ tin cậy thành `false` để từ chối tin cậy nguồn gốc chính xác.

`models.providers.<id>.models[].id` chỉ có phạm vi trong nhà cung cấp - không bao gồm tiền tố nhà cung cấp. Đối với máy chủ MLX được khởi động bằng `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình thị giác cục bộ hoặc được truy cập qua proxy để các tệp đính kèm hình ảnh được chèn vào lượt tác nhân. Quy trình thiết lập nhà cung cấp tùy chỉnh tương tác sẽ suy luận các mã định danh mô hình thị giác phổ biến và chỉ hỏi về các tên không xác định; quy trình thiết lập không tương tác sử dụng cùng cơ chế suy luận, với `--custom-image-input` / `--custom-text-input` để ghi đè.

Sử dụng `models.providers.<id>.timeoutSeconds` cho các máy chủ mô hình cục bộ/từ xa chậm trước khi tăng `agents.defaults.timeoutSeconds`. Thời gian chờ của nhà cung cấp bao gồm kết nối, tiêu đề, truyền luồng phần thân và toàn bộ quá trình hủy truy xuất có bảo vệ chỉ dành cho các yêu cầu HTTP của mô hình - nếu thời gian chờ của tác nhân/lần chạy thấp hơn, hãy tăng cả giá trị đó vì thời gian chờ của nhà cung cấp không thể kéo dài toàn bộ lần chạy.

<Note>
Đối với các nhà cung cấp tùy chỉnh tương thích OpenAI, một dấu hiệu cục bộ không phải bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` phân giải thành local loopback, mạng LAN riêng, `.local` hoặc tên máy chủ trần - OpenClaw xử lý dấu hiệu này như thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Hãy sử dụng giá trị thực cho mọi nhà cung cấp chấp nhận tên máy chủ công khai.
</Note>

Ghi chú hành vi dành cho các phần phụ trợ `/v1` cục bộ/được truy cập qua proxy:

- OpenClaw xử lý chúng như các tuyến tương thích OpenAI kiểu proxy, không phải các điểm cuối OpenAI gốc.
- Việc định hình yêu cầu chỉ dành cho OpenAI gốc không được áp dụng: không có `service_tier`, không có `store` của Responses, không định hình tải trọng tương thích suy luận OpenAI, không có gợi ý bộ nhớ đệm prompt.
- Các tiêu đề ghi nhận nguồn OpenClaw ẩn (`originator`, `version`, `User-Agent`) không được chèn vào URL proxy tùy chỉnh.

Các tùy chỉnh tương thích dành cho phần phụ trợ tương thích OpenAI nghiêm ngặt hơn:

- **Nội dung chỉ dạng chuỗi**: một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi, không chấp nhận mảng các phần nội dung có cấu trúc. Đặt `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Khóa thông điệp nghiêm ngặt**: nếu máy chủ từ chối các mục thông điệp có nhiều khóa hơn `role`/`content`, hãy đặt `compat.strictMessageKeys: true`.
- **Văn bản công cụ trong ngoặc vuông**: một số mô hình cục bộ phát ra các yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn `[tool_name]`, theo sau là JSON và `[END_TOOL_REQUEST]`. OpenClaw chỉ nâng cấp chúng thành lệnh gọi công cụ thực khi tên khớp chính xác với một công cụ đã đăng ký cho lượt đó; nếu không, chúng vẫn là văn bản ẩn, không được hỗ trợ.
- **Văn bản không có cấu trúc trông giống lệnh gọi công cụ**: nếu một mô hình phát ra văn bản kiểu JSON/XML/ReAct trông giống lệnh gọi công cụ nhưng không phải là một lời gọi có cấu trúc, OpenClaw giữ nguyên dưới dạng văn bản và ghi cảnh báo kèm mã định danh lần chạy, nhà cung cấp/mô hình, mẫu được phát hiện và tên công cụ nếu có. Đây là tình trạng không tương thích của nhà cung cấp/mô hình, không phải một lần chạy công cụ đã hoàn tất.
- **Buộc sử dụng công cụ**: nếu các công cụ xuất hiện dưới dạng văn bản của trợ lý (JSON/XML/ReAct thô hoặc một mảng `tool_calls` trống), trước tiên hãy xác nhận mẫu trò chuyện/trình phân tích cú pháp của máy chủ có hỗ trợ lệnh gọi công cụ. Nếu trình phân tích cú pháp chỉ hoạt động khi bắt buộc sử dụng công cụ, hãy ghi đè giá trị proxy mặc định `tool_choice: "auto"` cho từng mô hình:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Chỉ sử dụng tùy chọn này khi mọi lượt thông thường đều phải gọi công cụ. Thay `local/my-local-model` bằng tham chiếu chính xác từ `openclaw models list` hoặc đặt qua CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Các mức độ suy luận bổ sung**: nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận các mức độ suy luận OpenAI ngoài hồ sơ tích hợp sẵn, hãy khai báo chúng trong khối tương thích của mô hình. Việc thêm `"xhigh"` sẽ cung cấp mức này cho tham chiếu mô hình đó trong `/think xhigh`, bộ chọn phiên, quy trình xác thực Gateway và quy trình xác thực `llm-task`:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## Các phần phụ trợ nhỏ hơn hoặc nghiêm ngặt hơn

Nếu mô hình tải thành công nhưng các lượt tác nhân đầy đủ hoạt động không đúng, hãy xử lý từ trên xuống: trước tiên xác nhận lớp truyền tải, sau đó thu hẹp phạm vi.

1. **Xác nhận mô hình cục bộ phản hồi** - không dùng công cụ, không có ngữ cảnh tác nhân:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Xác nhận định tuyến Gateway** - chỉ gửi lời nhắc, bỏ qua bản ghi hội thoại, quá trình khởi tạo AGENTS, quá trình tập hợp công cụ ngữ cảnh, các công cụ và máy chủ MCP đi kèm, nhưng vẫn kiểm tra định tuyến Gateway, xác thực và lựa chọn nhà cung cấp:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Thử chế độ tinh gọn** nếu cả hai phép kiểm tra đều thành công nhưng các lượt chạy tác nhân thực tế gặp lỗi gọi công cụ sai định dạng hoặc lời nhắc quá lớn: đặt `agents.defaults.experimental.localModelLean: true`. Chế độ này loại bỏ các công cụ nặng dành cho trình duyệt, cron, tin nhắn, tạo nội dung đa phương tiện, giọng nói và PDF trừ khi được yêu cầu rõ ràng, đồng thời mặc định đặt các danh mục công cụ lớn hơn phía sau các cơ chế điều khiển Tìm kiếm công cụ có cấu trúc, trong khi vẫn hiển thị trực tiếp `exec`. Xem [Tính năng thử nghiệm -> Chế độ tinh gọn cho mô hình cục bộ](/vi/concepts/experimental-features#local-model-lean-mode) để biết chi tiết và cách xác nhận chế độ này đang bật.

4. **Tắt hoàn toàn công cụ như biện pháp cuối cùng** bằng cách đặt `models.providers.<provider>.models[].compat.supportsTools: false` cho mô hình đó - khi ấy tác nhân sẽ chạy mà không gọi công cụ.

5. **Sau đó, nút thắt nằm ở hệ thống thượng nguồn.** Nếu phần phụ trợ vẫn chỉ gặp lỗi trong các lượt chạy OpenClaw lớn hơn sau khi bật chế độ tinh gọn và đặt `supportsTools: false`, vấn đề còn lại thường nằm ở chính mô hình hoặc máy chủ - cửa sổ ngữ cảnh, bộ nhớ GPU, việc loại bỏ bộ nhớ đệm kv hoặc lỗi phần phụ trợ - chứ không phải lớp truyền tải của OpenClaw.

## Khắc phục sự cố

- **Gateway không thể kết nối với proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **Mô hình LM Studio đã bị dỡ tải?** Hãy tải lại; khởi động nguội là nguyên nhân phổ biến gây ra tình trạng "treo".
- **Máy chủ cục bộ báo `terminated`, `ECONNRESET` hoặc đóng luồng giữa chừng trong một lượt?** OpenClaw ghi lại `model.call.error.failureKind` có số lượng giá trị phân biệt thấp cùng với ảnh chụp nhanh RSS/heap của tiến trình OpenClaw trong dữ liệu chẩn đoán. Đối với áp lực bộ nhớ của LM Studio/Ollama, hãy đối chiếu dấu thời gian đó với nhật ký máy chủ hoặc nhật ký sự cố/jetsam của macOS để xác nhận máy chủ mô hình có bị chấm dứt hay không.
- **Lỗi ngữ cảnh?** OpenClaw suy ra các ngưỡng kiểm tra trước cửa sổ ngữ cảnh từ cửa sổ mô hình được phát hiện (hoặc cửa sổ bị giới hạn khi `agents.defaults.contextTokens` hạ thấp giá trị này), cảnh báo khi dưới 20% với mức sàn **8k** và chặn cứng khi dưới 10% với mức sàn **4k** (được giới hạn theo cửa sổ ngữ cảnh hiệu dụng để siêu dữ liệu mô hình quá lớn không thể từ chối giới hạn hợp lệ do người dùng đặt). Hạ `contextWindow` hoặc tăng giới hạn ngữ cảnh của máy chủ/mô hình.
- **`messages[].content ... expected a string`?** Thêm `compat.requiresStringContent: true` vào mục nhập của mô hình đó.
- **`validation.keys` hoặc "message entries only allow `role` and `content`"?** Thêm `compat.strictMessageKeys: true` vào mục nhập của mô hình đó.
- **Các lệnh gọi trực tiếp tới `/v1/chat/completions` hoạt động, nhưng `openclaw infer model run --local` gặp lỗi trên Gemma hoặc một mô hình cục bộ khác?** Trước tiên, hãy kiểm tra URL nhà cung cấp, tham chiếu mô hình, dấu hiệu xác thực và nhật ký máy chủ - `model run` bỏ qua hoàn toàn các công cụ của tác nhân. Nếu `model run` thành công nhưng các lượt tác nhân lớn hơn gặp lỗi, hãy giảm phạm vi công cụ bằng `localModelLean` hoặc `compat.supportsTools: false`.
- **Các lệnh gọi công cụ xuất hiện dưới dạng văn bản JSON/XML/ReAct thô hoặc nhà cung cấp trả về mảng `tool_calls` trống?** Không thêm proxy tự động chuyển đổi một cách máy móc văn bản của trợ lý thành thao tác thực thi công cụ - trước tiên hãy sửa mẫu trò chuyện/bộ phân tích cú pháp của máy chủ. Nếu mô hình chỉ hoạt động khi bắt buộc sử dụng công cụ, hãy thêm phần ghi đè `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục nhập mô hình đó cho các phiên mà mỗi lượt đều dự kiến có một lệnh gọi công cụ.
- **An toàn**: các mô hình cục bộ bỏ qua bộ lọc phía nhà cung cấp. Giữ phạm vi tác nhân ở mức hẹp và bật Compaction để hạn chế phạm vi ảnh hưởng của việc chèn lời nhắc.

## Liên quan

- [Tài liệu tham khảo về cấu hình](/vi/gateway/configuration-reference)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
