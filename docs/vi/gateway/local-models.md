---
read_when:
    - Bạn muốn phục vụ các mô hình từ máy GPU riêng của mình
    - Bạn đang kết nối LM Studio hoặc một proxy tương thích với OpenAI
    - Bạn cần hướng dẫn an toàn nhất về mô hình cục bộ
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, endpoint OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-06-27T17:30:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Có thể dùng mô hình cục bộ. Chúng cũng đặt yêu cầu cao hơn về phần cứng, kích thước ngữ cảnh và khả năng phòng vệ trước prompt injection — các card nhỏ hoặc được lượng tử hóa quá mạnh sẽ cắt ngắn ngữ cảnh và làm rò rỉ an toàn. Trang này là hướng dẫn có quan điểm rõ ràng cho các stack cục bộ cao cấp hơn và máy chủ cục bộ tùy chỉnh tương thích OpenAI. Để onboarding ít ma sát nhất, hãy bắt đầu với [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`.

Với các máy chủ cục bộ chỉ nên khởi động khi một mô hình được chọn cần đến chúng, xem
[Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).

## Mức phần cứng tối thiểu

Hãy đặt mục tiêu cao: **≥2 Mac Studio cấu hình tối đa hoặc một rig GPU tương đương (~$30k+)** để có vòng lặp agent thoải mái. Một GPU **24 GB** chỉ phù hợp cho prompt nhẹ hơn với độ trễ cao hơn. Luôn chạy **biến thể lớn nhất / đầy đủ kích thước mà bạn có thể host**; các checkpoint nhỏ hoặc bị lượng tử hóa nặng làm tăng rủi ro prompt injection (xem [Bảo mật](/vi/gateway/security)).

## Chọn backend

| Backend                                              | Dùng khi                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/vi/providers/ds4)                                | DeepSeek V4 Flash cục bộ trên macOS Metal với lệnh gọi công cụ tương thích OpenAI    |
| [LM Studio](/vi/providers/lmstudio)                     | Thiết lập cục bộ lần đầu, trình tải GUI, Responses API gốc                    |
| LiteLLM / OAI-proxy / proxy tùy chỉnh tương thích OpenAI | Bạn đứng trước một API mô hình khác và cần OpenClaw xử lý nó như OpenAI         |
| MLX / vLLM / SGLang                                  | Phục vụ tự host thông lượng cao với endpoint HTTP tương thích OpenAI |
| [Ollama](/vi/providers/ollama)                          | Quy trình CLI, thư viện mô hình, dịch vụ systemd không cần can thiệp                      |

Dùng Responses API (`api: "openai-responses"`) khi backend hỗ trợ (LM Studio có hỗ trợ). Nếu không, hãy dùng Chat Completions (`api: "openai-completions"`).

<Warning>
**Người dùng WSL2 + Ollama + NVIDIA/CUDA:** Trình cài đặt Ollama Linux chính thức bật một dịch vụ systemd với `Restart=always`. Trên các thiết lập GPU WSL2, tự khởi động có thể tải lại mô hình cuối cùng trong lúc boot và ghim bộ nhớ host. Nếu VM WSL2 của bạn liên tục khởi động lại sau khi bật Ollama, xem [vòng lặp crash WSL2](/vi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)

Stack cục bộ tốt nhất hiện tại. Tải một mô hình lớn trong LM Studio (ví dụ: bản dựng Qwen, DeepSeek hoặc Llama đầy đủ kích thước), bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`) và dùng Responses API để giữ phần suy luận tách khỏi văn bản cuối cùng.

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

**Checklist thiết lập**

- Cài đặt LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Trong LM Studio, tải xuống **bản dựng mô hình lớn nhất có sẵn** (tránh các biến thể "small"/bị lượng tử hóa nặng), khởi động máy chủ, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê mô hình đó.
- Thay `my-local-model` bằng ID mô hình thực tế hiển thị trong LM Studio.
- Giữ mô hình ở trạng thái đã tải; tải nguội sẽ làm tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn khác.
- Với WhatsApp, hãy dùng Responses API để chỉ văn bản cuối cùng được gửi đi.

Giữ các mô hình hosted được cấu hình ngay cả khi chạy cục bộ; dùng `models.mode: "merge"` để fallback vẫn khả dụng.

### Cấu hình lai: hosted làm chính, cục bộ làm fallback

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

### Ưu tiên cục bộ với lưới an toàn hosted

Hoán đổi thứ tự primary và fallback; giữ nguyên khối providers và `models.mode: "merge"` để bạn có thể fallback sang Sonnet hoặc Opus khi máy cục bộ không hoạt động.

### Hosting theo khu vực / định tuyến dữ liệu

- Các biến thể MiniMax/Kimi/GLM hosted cũng có trên OpenRouter với endpoint ghim theo khu vực (ví dụ: hosted tại Hoa Kỳ). Chọn biến thể theo khu vực ở đó để giữ lưu lượng trong vùng pháp lý bạn chọn trong khi vẫn dùng `models.mode: "merge"` cho fallback Anthropic/OpenAI.
- Chỉ cục bộ vẫn là đường dẫn riêng tư mạnh nhất; định tuyến hosted theo khu vực là phương án trung gian khi bạn cần tính năng của provider nhưng muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ tương thích OpenAI khác

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy hoặc gateway tùy chỉnh
sẽ hoạt động nếu chúng cung cấp endpoint `/v1/chat/completions` kiểu OpenAI.
Dùng adapter Chat Completions trừ khi backend ghi rõ có hỗ trợ
`/v1/responses`. Thay khối provider ở trên bằng endpoint và ID mô hình của bạn:

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

Nếu bỏ qua `api` trên provider tùy chỉnh có `baseUrl`, OpenClaw mặc định dùng
`openai-completions`. Các mục provider tùy chỉnh/cục bộ tin cậy đúng origin
`baseUrl` đã cấu hình cho các yêu cầu mô hình được bảo vệ, bao gồm loopback,
LAN, tailnet và host DNS riêng. Các yêu cầu tới origin riêng tư khác vẫn cần
`request.allowPrivateNetwork: true`; các origin metadata/link-local vẫn bị chặn
nếu không opt-in rõ ràng. Đặt giá trị này thành `false` để opt out khỏi tin cậy exact-origin.

Giá trị `models.providers.<id>.models[].id` là cục bộ theo provider. Không
bao gồm tiền tố provider ở đó. Ví dụ, một máy chủ MLX được khởi động với
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` nên dùng
ID catalog và model ref này:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình vision cục bộ hoặc được proxy
để attachment hình ảnh được chèn vào lượt agent. Onboarding provider tùy chỉnh
tương tác sẽ suy luận các ID mô hình vision phổ biến và chỉ hỏi với tên chưa biết.
Onboarding không tương tác dùng cùng suy luận; dùng `--custom-image-input`
cho ID vision chưa biết hoặc `--custom-text-input` khi một mô hình có vẻ quen thuộc
chỉ hỗ trợ văn bản phía sau endpoint của bạn.

Giữ `models.mode: "merge"` để mô hình hosted vẫn khả dụng làm fallback.
Dùng `models.providers.<id>.timeoutSeconds` cho máy chủ mô hình cục bộ hoặc từ xa
chậm trước khi tăng `agents.defaults.timeoutSeconds`. Timeout của provider
chỉ áp dụng cho yêu cầu HTTP mô hình, bao gồm kết nối, header, streaming body
và tổng abort guarded-fetch. Nếu timeout của agent hoặc run thấp hơn, cũng hãy tăng
trần đó vì timeout của provider không thể kéo dài toàn bộ agent run.

<Note>
Với các provider tùy chỉnh tương thích OpenAI, việc lưu một marker cục bộ không phải bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` phân giải tới loopback, LAN riêng, `.local` hoặc hostname trần. OpenClaw xem đó là thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Dùng một giá trị thật cho bất kỳ provider nào chấp nhận hostname công khai.
</Note>

Ghi chú hành vi cho backend `/v1` cục bộ/được proxy:

- OpenClaw xử lý chúng như các route tương thích OpenAI kiểu proxy, không phải endpoint
  OpenAI gốc
- định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây: không có
  `service_tier`, không có Responses `store`, không định hình payload tương thích reasoning của OpenAI,
  và không có gợi ý prompt-cache
- các header phân bổ ẩn của OpenClaw (`originator`, `version`, `User-Agent`)
  không được chèn vào các URL proxy tùy chỉnh này

Ghi chú tương thích cho các backend tương thích OpenAI nghiêm ngặt hơn:

- Một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi trên Chat Completions, không
  chấp nhận mảng structured content-part. Đặt
  `models.providers.<provider>.models[].compat.requiresStringContent: true` cho
  các endpoint đó.
- Một số mô hình cục bộ phát ra yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn
  `[tool_name]` theo sau là JSON và `[END_TOOL_REQUEST]`. OpenClaw chỉ nâng cấp
  chúng thành lệnh gọi công cụ thật khi tên khớp chính xác với một công cụ đã đăng ký
  cho lượt đó; nếu không, khối này được xử lý là văn bản không được hỗ trợ và bị
  ẩn khỏi phản hồi hiển thị với người dùng.
- Nếu mô hình phát ra JSON, XML hoặc văn bản kiểu ReAct trông giống lệnh gọi công cụ
  nhưng provider không phát ra invocation có cấu trúc, OpenClaw giữ nguyên dưới dạng
  văn bản và ghi cảnh báo kèm run id, provider/model, mẫu phát hiện được và
  tên công cụ khi có. Hãy xem đó là sự không tương thích tool-call của provider/model,
  không phải một tool run đã hoàn tất.
- Nếu công cụ xuất hiện dưới dạng văn bản assistant thay vì chạy, ví dụ JSON thô,
  XML, cú pháp ReAct hoặc mảng `tool_calls` rỗng trong phản hồi provider,
  trước tiên hãy xác minh máy chủ đang dùng chat template/parser có khả năng tool-call. Với
  các backend Chat Completions tương thích OpenAI mà parser chỉ hoạt động khi tool
  use bị ép buộc, hãy đặt override yêu cầu theo từng mô hình thay vì dựa vào phân tích
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

  Chỉ dùng điều này cho các mô hình/phiên mà mọi lượt thông thường đều nên gọi công cụ.
  Nó ghi đè giá trị proxy mặc định của OpenClaw là `tool_choice: "auto"`.
  Thay `local/my-local-model` bằng provider/model ref chính xác được hiển thị bởi
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận các mức nỗ lực reasoning của OpenAI ngoài
  profile tích hợp, hãy khai báo chúng trên khối compat của mô hình. Thêm `"xhigh"`
  ở đây sẽ khiến `/think xhigh`, trình chọn phiên, xác thực Gateway và xác thực `llm-task`
  hiển thị mức đó cho provider/model ref đã cấu hình:

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

## Phần phụ trợ nhỏ hơn hoặc nghiêm ngặt hơn

Nếu mô hình tải sạch nhưng các lượt tác nhân đầy đủ hoạt động sai, hãy xử lý từ trên xuống — xác nhận lớp truyền tải trước, rồi thu hẹp bề mặt.

1. **Xác nhận chính mô hình cục bộ có phản hồi.** Không có công cụ, không có ngữ cảnh tác nhân:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Xác nhận định tuyến Gateway.** Chỉ gửi prompt được cung cấp — bỏ qua bản ghi hội thoại, khởi động AGENTS, lắp ráp công cụ ngữ cảnh, công cụ và các máy chủ MCP đi kèm, nhưng vẫn kiểm tra định tuyến Gateway, xác thực và lựa chọn nhà cung cấp:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Thử chế độ gọn nhẹ.** Nếu cả hai phép kiểm tra đều đạt nhưng các lượt tác nhân thực tế thất bại với lệnh gọi công cụ sai định dạng hoặc prompt quá lớn, hãy bật `agents.defaults.experimental.localModelLean: true`. Chế độ này bỏ ba công cụ mặc định nặng nhất (`browser`, `cron`, `message`) và đặt các danh mục công cụ lớn hơn sau các điều khiển Tìm kiếm Công cụ có cấu trúc, ngoại trừ những lượt chạy bắt buộc phải giữ ngữ nghĩa gửi `message` trực tiếp. Xem [Tính năng thử nghiệm → Chế độ gọn nhẹ cho mô hình cục bộ](/vi/concepts/experimental-features#local-model-lean-mode) để biết giải thích đầy đủ, khi nào nên dùng và cách xác nhận chế độ này đang bật.

4. **Tắt hoàn toàn công cụ như phương án cuối cùng.** Nếu chế độ gọn nhẹ vẫn chưa đủ, hãy đặt `models.providers.<provider>.models[].compat.supportsTools: false` cho mục mô hình đó. Khi đó tác nhân sẽ hoạt động không có lệnh gọi công cụ trên mô hình đó.

5. **Sau đó, nút thắt nằm ở thượng nguồn.** Nếu phần phụ trợ vẫn chỉ thất bại trên các lượt chạy OpenClaw lớn hơn sau chế độ gọn nhẹ và `supportsTools: false`, vấn đề còn lại thường là năng lực của mô hình hoặc máy chủ thượng nguồn — cửa sổ ngữ cảnh, bộ nhớ GPU, loại bỏ kv-cache hoặc lỗi phần phụ trợ. Tại thời điểm đó, đây không còn là lớp truyền tải của OpenClaw.

## Khắc phục sự cố

- Gateway có thể truy cập proxy không? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio đã bị dỡ tải? Tải lại; khởi động nguội là một nguyên nhân "treo" phổ biến.
- Máy chủ cục bộ báo `terminated`, `ECONNRESET` hoặc đóng luồng giữa lượt?
  OpenClaw ghi lại `model.call.error.failureKind` có số lượng giá trị thấp cùng với
  ảnh chụp nhanh RSS/heap của tiến trình OpenClaw trong chẩn đoán. Với áp lực
  bộ nhớ của LM Studio/Ollama, hãy đối chiếu dấu thời gian đó với nhật ký máy chủ
  hoặc nhật ký crash / jetsam của macOS để xác nhận máy chủ mô hình có bị kết thúc hay không.
- OpenClaw suy ra các ngưỡng kiểm tra trước cửa sổ ngữ cảnh từ cửa sổ mô hình được phát hiện, hoặc từ cửa sổ mô hình chưa giới hạn khi `agents.defaults.contextTokens` hạ thấp cửa sổ hiệu dụng. OpenClaw cảnh báo dưới 20% với sàn **8k**. Chặn cứng dùng ngưỡng 10% với sàn **4k**, được giới hạn theo cửa sổ ngữ cảnh hiệu dụng để siêu dữ liệu mô hình quá lớn không thể từ chối một giới hạn người dùng vốn hợp lệ. Nếu gặp kiểm tra trước đó, hãy tăng giới hạn ngữ cảnh máy chủ/mô hình hoặc chọn mô hình lớn hơn.
- Lỗi ngữ cảnh? Giảm `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- Máy chủ tương thích OpenAI trả về `messages[].content ... expected a string`?
  Thêm `compat.requiresStringContent: true` vào mục mô hình đó.
- Máy chủ tương thích OpenAI trả về `validation.keys` hoặc nói các mục tin nhắn chỉ cho phép `role` và `content`?
  Thêm `compat.strictMessageKeys: true` vào mục mô hình đó.
- Các lệnh gọi `/v1/chat/completions` trực tiếp và rất nhỏ hoạt động, nhưng `openclaw infer model run --local`
  thất bại trên Gemma hoặc một mô hình cục bộ khác? Trước tiên hãy kiểm tra URL nhà cung cấp, tham chiếu mô hình, dấu hiệu xác thực
  và nhật ký máy chủ; `model run` cục bộ không bao gồm công cụ tác nhân.
  Nếu `model run` cục bộ thành công nhưng các lượt tác nhân lớn hơn thất bại, hãy giảm bề mặt
  công cụ của tác nhân bằng `localModelLean` hoặc `compat.supportsTools: false`.
- Lệnh gọi công cụ xuất hiện dưới dạng văn bản JSON/XML/ReAct thô, hoặc nhà cung cấp trả về
  mảng `tool_calls` rỗng? Đừng thêm proxy chuyển đổi mù quáng văn bản của trợ lý
  thành thực thi công cụ. Trước tiên hãy sửa mẫu/phân tích cú pháp chat của máy chủ. Nếu
  mô hình chỉ hoạt động khi bắt buộc dùng công cụ, hãy thêm phần ghi đè theo từng mô hình
  `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục mô hình đó
  cho các phiên mà mỗi lượt đều dự kiến có lệnh gọi công cụ.
- An toàn: mô hình cục bộ bỏ qua bộ lọc phía nhà cung cấp; giữ tác nhân ở phạm vi hẹp và bật Compaction để giới hạn phạm vi ảnh hưởng của chèn prompt.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
