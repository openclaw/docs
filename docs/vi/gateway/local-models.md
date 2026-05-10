---
read_when:
    - Bạn muốn phục vụ các mô hình từ máy GPU riêng của mình
    - Bạn đang cấu hình LM Studio hoặc một máy chủ proxy tương thích với OpenAI
    - Bạn cần hướng dẫn về mô hình cục bộ an toàn nhất
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, các điểm cuối OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-05-10T19:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Các mô hình cục bộ là khả thi. Chúng cũng đặt yêu cầu cao hơn về phần cứng, kích thước ngữ cảnh và khả năng phòng thủ trước prompt-injection — các card nhỏ hoặc bị lượng tử hóa quá mạnh sẽ cắt ngắn ngữ cảnh và làm rò rỉ mức an toàn. Trang này là hướng dẫn có quan điểm rõ ràng dành cho các stack cục bộ cao cấp hơn và máy chủ cục bộ tùy chỉnh tương thích OpenAI. Để bắt đầu với ít ma sát nhất, hãy dùng [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`.

Đối với các máy chủ cục bộ chỉ nên khởi động khi một mô hình được chọn cần đến chúng, hãy xem
[Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).

## Mức phần cứng tối thiểu

Hãy nhắm cao: **≥2 Mac Studio cấu hình tối đa hoặc một dàn GPU tương đương (~$30k+)** để có vòng lặp tác nhân thoải mái. Một GPU **24 GB** duy nhất chỉ phù hợp với các prompt nhẹ hơn ở độ trễ cao hơn. Luôn chạy **biến thể lớn nhất / kích thước đầy đủ mà bạn có thể host**; các checkpoint nhỏ hoặc bị lượng tử hóa nặng làm tăng rủi ro prompt-injection (xem [Bảo mật](/vi/gateway/security)).

## Chọn phần phụ trợ

| Phần phụ trợ                                      | Dùng khi                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/vi/providers/lmstudio)                     | Thiết lập cục bộ lần đầu, trình nạp GUI, Responses API gốc                    |
| [Ollama](/vi/providers/ollama)                          | Quy trình CLI, thư viện mô hình, dịch vụ systemd không cần can thiệp                      |
| MLX / vLLM / SGLang                                  | Phục vụ tự host thông lượng cao với điểm cuối HTTP tương thích OpenAI |
| LiteLLM / OAI-proxy / proxy tùy chỉnh tương thích OpenAI | Bạn đứng trước một API mô hình khác và cần OpenClaw xử lý nó như OpenAI         |

Dùng Responses API (`api: "openai-responses"`) khi phần phụ trợ hỗ trợ nó (LM Studio có hỗ trợ). Nếu không, hãy dùng Chat Completions (`api: "openai-completions"`).

<Warning>
**Người dùng WSL2 + Ollama + NVIDIA/CUDA:** Trình cài đặt Ollama Linux chính thức bật một dịch vụ systemd với `Restart=always`. Trên các thiết lập GPU WSL2, tự động khởi động có thể tải lại mô hình cuối cùng trong lúc boot và ghim bộ nhớ máy host. Nếu VM WSL2 của bạn liên tục khởi động lại sau khi bật Ollama, hãy xem [vòng lặp sập WSL2](/vi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)

Stack cục bộ tốt nhất hiện nay. Nạp một mô hình lớn trong LM Studio (ví dụ: một bản dựng Qwen, DeepSeek hoặc Llama kích thước đầy đủ), bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`) và dùng Responses API để tách phần suy luận khỏi văn bản cuối cùng.

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

**Danh sách kiểm tra thiết lập**

- Cài đặt LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Trong LM Studio, tải xuống **bản dựng mô hình lớn nhất hiện có** (tránh các biến thể "small"/bị lượng tử hóa nặng), khởi động máy chủ, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê mô hình đó.
- Thay `my-local-model` bằng ID mô hình thực tế hiển thị trong LM Studio.
- Giữ mô hình đã được nạp; nạp lạnh sẽ tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn khác.
- Với WhatsApp, hãy dùng Responses API để chỉ văn bản cuối cùng được gửi.

Giữ các mô hình được host trong cấu hình ngay cả khi chạy cục bộ; dùng `models.mode: "merge"` để các phương án dự phòng vẫn khả dụng.

### Cấu hình lai: mô hình được host làm chính, cục bộ làm dự phòng

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

### Ưu tiên cục bộ với lưới an toàn được host

Đổi thứ tự chính và dự phòng; giữ nguyên khối providers và `models.mode: "merge"` để bạn có thể dự phòng sang Sonnet hoặc Opus khi máy cục bộ ngừng hoạt động.

### Hosting theo khu vực / định tuyến dữ liệu

- Các biến thể MiniMax/Kimi/GLM được host cũng tồn tại trên OpenRouter với các điểm cuối ghim theo khu vực (ví dụ: được host tại Hoa Kỳ). Chọn biến thể khu vực ở đó để giữ lưu lượng trong phạm vi pháp lý bạn chọn trong khi vẫn dùng `models.mode: "merge"` cho dự phòng Anthropic/OpenAI.
- Chỉ cục bộ vẫn là con đường riêng tư mạnh nhất; định tuyến khu vực được host là phương án trung gian khi bạn cần các tính năng của nhà cung cấp nhưng muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ tương thích OpenAI khác

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy hoặc các
Gateway tùy chỉnh hoạt động nếu chúng cung cấp điểm cuối kiểu OpenAI
`/v1/chat/completions`. Dùng bộ chuyển đổi Chat Completions trừ khi phần phụ trợ
tài liệu hóa rõ ràng rằng có hỗ trợ `/v1/responses`. Thay khối provider ở trên bằng
điểm cuối và ID mô hình của bạn:

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

Nếu `api` bị bỏ qua trên một provider tùy chỉnh có `baseUrl`, OpenClaw mặc định dùng
`openai-completions`. Các điểm cuối loopback như `127.0.0.1` được tin cậy
tự động; các điểm cuối LAN, tailnet và DNS riêng vẫn cần
`request.allowPrivateNetwork: true`.

Giá trị `models.providers.<id>.models[].id` là cục bộ theo provider. Đừng
bao gồm tiền tố provider ở đó. Ví dụ: một máy chủ MLX được khởi động với
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` nên dùng
ID danh mục và tham chiếu mô hình này:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình thị giác cục bộ hoặc qua proxy để
tệp đính kèm hình ảnh được chèn vào các lượt tác nhân. Onboarding provider tùy chỉnh
tương tác suy luận các ID mô hình thị giác phổ biến và chỉ hỏi với tên chưa biết.
Onboarding không tương tác dùng cùng suy luận đó; dùng `--custom-image-input`
cho các ID thị giác chưa biết hoặc `--custom-text-input` khi một mô hình trông có vẻ đã biết
chỉ là văn bản phía sau điểm cuối của bạn.

Giữ `models.mode: "merge"` để các mô hình được host vẫn khả dụng làm dự phòng.
Dùng `models.providers.<id>.timeoutSeconds` cho các máy chủ mô hình cục bộ hoặc từ xa
chậm trước khi tăng `agents.defaults.timeoutSeconds`. Thời gian chờ provider
chỉ áp dụng cho các yêu cầu HTTP mô hình, bao gồm kết nối, header, phát trực tuyến body
và toàn bộ lần hủy guarded-fetch.

<Note>
Đối với các provider tùy chỉnh tương thích OpenAI, việc lưu một dấu cục bộ không bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` phân giải tới loopback, LAN riêng, `.local` hoặc hostname trần. OpenClaw xử lý nó như thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Hãy dùng một giá trị thật cho bất kỳ provider nào chấp nhận hostname công khai.
</Note>

Ghi chú hành vi cho các phần phụ trợ `/v1` cục bộ/qua proxy:

- OpenClaw xử lý chúng như các tuyến tương thích OpenAI kiểu proxy, không phải
  điểm cuối OpenAI gốc
- định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây: không có
  `service_tier`, không có Responses `store`, không có định hình payload
  tương thích suy luận OpenAI và không có gợi ý prompt-cache
- các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`)
  không được chèn trên các URL proxy tùy chỉnh này

Ghi chú tương thích cho các phần phụ trợ tương thích OpenAI nghiêm ngặt hơn:

- Một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi trên Chat Completions, không
  chấp nhận mảng phần nội dung có cấu trúc. Đặt
  `models.providers.<provider>.models[].compat.requiresStringContent: true` cho
  các điểm cuối đó.
- Một số mô hình cục bộ phát ra yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn
  `[tool_name]` theo sau là JSON và `[END_TOOL_REQUEST]`. OpenClaw nâng cấp
  chúng thành lệnh gọi công cụ thật chỉ khi tên khớp chính xác với một công cụ đã đăng ký
  cho lượt đó; nếu không, khối này được xem là văn bản không được hỗ trợ và bị
  ẩn khỏi các phản hồi hiển thị với người dùng.
- Nếu một mô hình phát ra JSON, XML hoặc văn bản kiểu ReAct trông giống lệnh gọi công cụ
  nhưng provider không phát ra lời gọi có cấu trúc, OpenClaw giữ nó dưới dạng
  văn bản và ghi cảnh báo kèm run id, provider/mô hình, mẫu được phát hiện và
  tên công cụ khi có. Hãy xem đó là tình trạng không tương thích lệnh gọi công cụ
  của provider/mô hình, không phải một lần chạy công cụ đã hoàn tất.
- Nếu công cụ xuất hiện dưới dạng văn bản assistant thay vì chạy, ví dụ JSON thô,
  XML, cú pháp ReAct hoặc mảng `tool_calls` rỗng trong phản hồi provider,
  trước tiên hãy xác minh máy chủ đang dùng chat template/parser có khả năng gọi công cụ. Đối với
  các phần phụ trợ Chat Completions tương thích OpenAI có parser chỉ hoạt động khi việc dùng công cụ
  bị ép buộc, hãy đặt ghi đè yêu cầu theo mô hình thay vì dựa vào phân tích
  văn bản:

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

  Chỉ dùng cách này cho các mô hình/phiên mà mọi lượt bình thường đều nên gọi một công cụ.
  Nó ghi đè giá trị proxy mặc định của OpenClaw là `tool_choice: "auto"`.
  Thay `local/my-local-model` bằng tham chiếu provider/mô hình chính xác hiển thị bởi
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận các mức nỗ lực suy luận OpenAI ngoài
  hồ sơ tích hợp sẵn, hãy khai báo chúng trên khối compat của mô hình. Việc thêm `"xhigh"`
  ở đây khiến `/think xhigh`, bộ chọn phiên, xác thực Gateway và xác thực `llm-task`
  hiển thị mức này cho tham chiếu provider/mô hình đã cấu hình đó:

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

Nếu mô hình tải sạch nhưng các lượt tác tử đầy đủ hoạt động sai, hãy xử lý từ trên xuống — xác nhận transport trước, rồi thu hẹp bề mặt.

1. **Xác nhận chính mô hình cục bộ phản hồi.** Không có công cụ, không có ngữ cảnh tác tử:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Xác nhận định tuyến Gateway.** Chỉ gửi prompt đã cung cấp — bỏ qua transcript, khởi tạo AGENTS, lắp ráp context-engine, công cụ và các máy chủ MCP được đóng gói, nhưng vẫn kiểm tra định tuyến Gateway, xác thực và lựa chọn provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Thử chế độ tinh gọn.** Nếu cả hai phép kiểm tra đều đạt nhưng các lượt tác tử thực tế thất bại với lệnh gọi công cụ sai định dạng hoặc prompt quá lớn, hãy bật `agents.defaults.experimental.localModelLean: true`. Chế độ này bỏ ba công cụ mặc định nặng nhất (`browser`, `cron`, `message`) để hình dạng prompt nhỏ hơn và ít dễ vỡ hơn. Xem [Tính năng thử nghiệm → Chế độ tinh gọn cho mô hình cục bộ](/vi/concepts/experimental-features#local-model-lean-mode) để biết phần giải thích đầy đủ, khi nào nên dùng và cách xác nhận chế độ đã bật.

4. **Tắt hoàn toàn công cụ như phương án cuối cùng.** Nếu chế độ tinh gọn vẫn chưa đủ, hãy đặt `models.providers.<provider>.models[].compat.supportsTools: false` cho mục mô hình đó. Khi đó tác tử sẽ hoạt động trên mô hình đó mà không có lệnh gọi công cụ.

5. **Sau điểm đó, nút thắt nằm ở thượng nguồn.** Nếu backend vẫn chỉ thất bại trên các lượt chạy OpenClaw lớn hơn sau chế độ tinh gọn và `supportsTools: false`, vấn đề còn lại thường là mô hình thượng nguồn hoặc năng lực máy chủ — cửa sổ ngữ cảnh, bộ nhớ GPU, loại bỏ kv-cache, hoặc lỗi backend. Tại thời điểm đó, đó không phải là lớp transport của OpenClaw.

## Khắc phục sự cố

- Gateway có thể truy cập proxy? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio đã bị dỡ tải? Tải lại; khởi động nguội là nguyên nhân "treo" phổ biến.
- Máy chủ cục bộ báo `terminated`, `ECONNRESET`, hoặc đóng stream giữa lượt?
  OpenClaw ghi lại `model.call.error.failureKind` có số lượng giá trị thấp cùng với
  ảnh chụp RSS/heap của tiến trình OpenClaw trong chẩn đoán. Với áp lực bộ nhớ
  của LM Studio/Ollama, hãy khớp dấu thời gian đó với nhật ký máy chủ hoặc nhật ký crash /
  jetsam của macOS để xác nhận máy chủ mô hình có bị kill hay không.
- OpenClaw suy ra các ngưỡng preflight của cửa sổ ngữ cảnh từ cửa sổ mô hình được phát hiện, hoặc từ cửa sổ mô hình không bị giới hạn khi `agents.defaults.contextTokens` hạ cửa sổ hiệu dụng. Nó cảnh báo dưới 20% với sàn **8k**. Chặn cứng dùng ngưỡng 10% với sàn **4k**, được giới hạn theo cửa sổ ngữ cảnh hiệu dụng để metadata mô hình quá lớn không thể từ chối một giới hạn người dùng vốn hợp lệ. Nếu gặp preflight đó, hãy tăng giới hạn ngữ cảnh của máy chủ/mô hình hoặc chọn mô hình lớn hơn.
- Lỗi ngữ cảnh? Hạ `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- Máy chủ tương thích OpenAI trả về `messages[].content ... expected a string`?
  Thêm `compat.requiresStringContent: true` vào mục mô hình đó.
- Máy chủ tương thích OpenAI trả về `validation.keys` hoặc nói rằng các mục message chỉ cho phép `role` và `content`?
  Thêm `compat.strictMessageKeys: true` vào mục mô hình đó.
- Các lệnh gọi nhỏ trực tiếp tới `/v1/chat/completions` hoạt động, nhưng `openclaw infer model run --local`
  thất bại trên Gemma hoặc một mô hình cục bộ khác? Trước tiên hãy kiểm tra URL provider, model ref, marker xác thực
  và nhật ký máy chủ; `model run` cục bộ không bao gồm công cụ tác tử.
  Nếu `model run` cục bộ thành công nhưng các lượt tác tử lớn hơn thất bại, hãy giảm bề mặt
  công cụ của tác tử bằng `localModelLean` hoặc `compat.supportsTools: false`.
- Lệnh gọi công cụ xuất hiện dưới dạng văn bản JSON/XML/ReAct thô, hoặc provider trả về
  mảng `tool_calls` rỗng? Đừng thêm proxy chuyển đổi mù quáng văn bản assistant
  thành thực thi công cụ. Trước tiên hãy sửa chat template/parser của máy chủ. Nếu
  mô hình chỉ hoạt động khi bắt buộc dùng công cụ, hãy thêm ghi đè theo từng mô hình
  `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục mô hình đó
  cho các phiên mà mỗi lượt đều dự kiến có một lệnh gọi công cụ.
- An toàn: mô hình cục bộ bỏ qua bộ lọc phía provider; giữ tác tử trong phạm vi hẹp và bật Compaction để giới hạn phạm vi ảnh hưởng của prompt injection.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
