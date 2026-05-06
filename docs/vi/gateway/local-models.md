---
read_when:
    - Bạn muốn cung cấp mô hình từ máy GPU riêng của mình
    - Bạn đang cấu hình LM Studio hoặc một proxy tương thích với OpenAI
    - Bạn cần hướng dẫn về mô hình cục bộ an toàn nhất
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, các điểm cuối OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-05-06T09:13:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

Các mô hình cục bộ có thể làm được. Chúng cũng đặt yêu cầu cao hơn về phần cứng, kích thước ngữ cảnh và phòng thủ chống prompt injection — các card nhỏ hoặc lượng tử hóa quá mạnh sẽ cắt ngắn ngữ cảnh và làm suy giảm an toàn. Trang này là hướng dẫn có chủ đích cho các stack cục bộ cao cấp hơn và các máy chủ cục bộ tùy chỉnh tương thích OpenAI. Để onboarding ít trở ngại nhất, hãy bắt đầu với [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`.

## Mức phần cứng tối thiểu

Hãy nhắm cao: **≥2 Mac Studio cấu hình tối đa hoặc một rig GPU tương đương (~$30k+)** để có vòng lặp agent thoải mái. Một GPU **24 GB** chỉ phù hợp cho prompt nhẹ hơn với độ trễ cao hơn. Luôn chạy **biến thể lớn nhất / đầy đủ kích thước mà bạn có thể host**; checkpoint nhỏ hoặc bị lượng tử hóa nặng làm tăng rủi ro prompt injection (xem [Bảo mật](/vi/gateway/security)).

## Chọn một backend

| Backend                                              | Dùng khi                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [LM Studio](/vi/providers/lmstudio)                     | Thiết lập cục bộ lần đầu, trình tải GUI, Responses API gốc                   |
| [Ollama](/vi/providers/ollama)                          | Quy trình CLI, thư viện mô hình, dịch vụ systemd không cần can thiệp         |
| MLX / vLLM / SGLang                                  | Phục vụ tự host thông lượng cao với endpoint HTTP tương thích OpenAI         |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | Bạn đứng trước một API mô hình khác và cần OpenClaw xử lý nó như OpenAI      |

Dùng Responses API (`api: "openai-responses"`) khi backend hỗ trợ (LM Studio có hỗ trợ). Nếu không, hãy dùng Chat Completions (`api: "openai-completions"`).

<Warning>
**Người dùng WSL2 + Ollama + NVIDIA/CUDA:** Trình cài đặt Ollama Linux chính thức bật một dịch vụ systemd với `Restart=always`. Trên các thiết lập WSL2 GPU, tự khởi động có thể tải lại mô hình gần nhất khi boot và ghim bộ nhớ host. Nếu VM WSL2 của bạn liên tục khởi động lại sau khi bật Ollama, xem [vòng lặp sự cố WSL2](/vi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)

Stack cục bộ tốt nhất hiện nay. Tải một mô hình lớn trong LM Studio (ví dụ: một bản build Qwen, DeepSeek hoặc Llama đầy đủ kích thước), bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`), và dùng Responses API để tách reasoning khỏi văn bản cuối cùng.

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
- Trong LM Studio, tải xuống **bản build mô hình lớn nhất có sẵn** (tránh các biến thể "small"/bị lượng tử hóa nặng), khởi động máy chủ, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê nó.
- Thay `my-local-model` bằng ID mô hình thực tế hiển thị trong LM Studio.
- Giữ mô hình được tải; tải nguội sẽ tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản build LM Studio của bạn khác.
- Với WhatsApp, hãy dùng Responses API để chỉ văn bản cuối cùng được gửi.

Giữ các mô hình hosted được cấu hình ngay cả khi chạy cục bộ; dùng `models.mode: "merge"` để các fallback vẫn khả dụng.

### Cấu hình hybrid: primary hosted, fallback cục bộ

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

Đổi thứ tự primary và fallback; giữ nguyên khối providers và `models.mode: "merge"` để bạn có thể fallback sang Sonnet hoặc Opus khi máy cục bộ ngừng hoạt động.

### Hosting theo khu vực / định tuyến dữ liệu

- Các biến thể hosted MiniMax/Kimi/GLM cũng có trên OpenRouter với endpoint ghim theo khu vực (ví dụ: hosted tại Hoa Kỳ). Chọn biến thể khu vực ở đó để giữ lưu lượng trong phạm vi pháp lý bạn chọn trong khi vẫn dùng `models.mode: "merge"` cho fallback Anthropic/OpenAI.
- Chỉ cục bộ vẫn là đường dẫn quyền riêng tư mạnh nhất; định tuyến hosted theo khu vực là phương án trung gian khi bạn cần tính năng của nhà cung cấp nhưng vẫn muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ tương thích OpenAI khác

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy hoặc Gateway tùy chỉnh hoạt động nếu chúng cung cấp endpoint kiểu OpenAI `/v1/chat/completions`. Dùng adapter Chat Completions trừ khi backend ghi rõ hỗ trợ `/v1/responses`. Thay khối provider ở trên bằng endpoint và ID mô hình của bạn:

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

Nếu `api` bị bỏ qua trên provider tùy chỉnh có `baseUrl`, OpenClaw mặc định dùng `openai-completions`. Các endpoint loopback như `127.0.0.1` được tin cậy tự động; endpoint LAN, tailnet và DNS riêng vẫn cần `request.allowPrivateNetwork: true`.

Giá trị `models.providers.<id>.models[].id` là cục bộ theo provider. Không đưa tiền tố provider vào đó. Ví dụ: một máy chủ MLX được khởi động bằng `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` nên dùng ID catalog và model ref này:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình vision cục bộ hoặc qua proxy để tệp đính kèm hình ảnh được chèn vào lượt agent. Onboarding provider tùy chỉnh tương tác suy luận các ID mô hình vision phổ biến và chỉ hỏi với tên chưa biết. Onboarding không tương tác dùng cùng suy luận; dùng `--custom-image-input` cho ID vision chưa biết hoặc `--custom-text-input` khi một mô hình trông có vẻ đã biết nhưng chỉ là text-only sau endpoint của bạn.

Giữ `models.mode: "merge"` để các mô hình hosted vẫn khả dụng làm fallback. Dùng `models.providers.<id>.timeoutSeconds` cho máy chủ mô hình cục bộ hoặc từ xa chậm trước khi tăng `agents.defaults.timeoutSeconds`. Timeout của provider chỉ áp dụng cho yêu cầu HTTP mô hình, bao gồm kết nối, header, truyền body theo luồng và lần hủy guarded-fetch tổng thể.

<Note>
Với các provider tùy chỉnh tương thích OpenAI, việc lưu một marker cục bộ không bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` trỏ tới loopback, LAN riêng, `.local` hoặc một hostname trần. OpenClaw xử lý nó như một thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Dùng giá trị thật cho bất kỳ provider nào chấp nhận hostname công khai.
</Note>

Ghi chú hành vi cho backend `/v1` cục bộ/qua proxy:

- OpenClaw xử lý chúng như các route tương thích OpenAI kiểu proxy, không phải endpoint OpenAI gốc
- định dạng yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây: không có `service_tier`, không có Responses `store`, không định dạng payload tương thích reasoning của OpenAI, và không có gợi ý prompt-cache
- các header quy kết ẩn của OpenClaw (`originator`, `version`, `User-Agent`) không được chèn vào các URL proxy tùy chỉnh này

Ghi chú tương thích cho các backend tương thích OpenAI nghiêm ngặt hơn:

- Một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi trên Chat Completions, không chấp nhận mảng content-part có cấu trúc. Đặt `models.providers.<provider>.models[].compat.requiresStringContent: true` cho các endpoint đó.
- Một số mô hình cục bộ phát ra yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn `[tool_name]` theo sau là JSON và `[END_TOOL_REQUEST]`. OpenClaw chỉ nâng chúng thành tool call thật khi tên khớp chính xác với một công cụ đã đăng ký cho lượt đó; nếu không, block được xử lý như văn bản không được hỗ trợ và bị ẩn khỏi phản hồi hiển thị cho người dùng.
- Nếu mô hình phát ra JSON, XML hoặc văn bản kiểu ReAct trông giống tool call nhưng provider không phát ra invocation có cấu trúc, OpenClaw giữ nó dưới dạng văn bản và ghi log cảnh báo với run id, provider/model, pattern được phát hiện và tên công cụ khi có. Hãy xem đó là bất tương thích tool-call của provider/model, không phải một lần chạy công cụ đã hoàn tất.
- Nếu công cụ xuất hiện dưới dạng văn bản của assistant thay vì chạy, ví dụ JSON thô, XML, cú pháp ReAct hoặc mảng `tool_calls` rỗng trong phản hồi của provider, trước tiên hãy xác minh máy chủ đang dùng chat template/parser có khả năng tool-call. Với các backend Chat Completions tương thích OpenAI mà parser chỉ hoạt động khi bắt buộc dùng công cụ, hãy đặt override yêu cầu theo từng mô hình thay vì dựa vào phân tích văn bản:

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

  Chỉ dùng điều này cho các mô hình/phiên mà mọi lượt bình thường đều nên gọi một công cụ. Nó ghi đè giá trị proxy mặc định của OpenClaw là `tool_choice: "auto"`. Thay `local/my-local-model` bằng provider/model ref chính xác hiển thị bởi `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận OpenAI reasoning efforts ngoài profile tích hợp sẵn, hãy khai báo chúng trên khối compat của mô hình. Thêm `"xhigh"` ở đây sẽ khiến `/think xhigh`, bộ chọn phiên, kiểm tra hợp lệ của Gateway và kiểm tra hợp lệ `llm-task` hiển thị mức đó cho provider/model ref đã cấu hình:

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

## Backend nhỏ hơn hoặc nghiêm ngặt hơn

Nếu mô hình tải sạch nhưng toàn bộ lượt agent hoạt động sai, hãy xử lý từ trên xuống — xác nhận transport trước, rồi thu hẹp bề mặt.

1. **Xác nhận bản thân mô hình cục bộ phản hồi.** Không có công cụ, không có ngữ cảnh tác tử:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Xác nhận định tuyến Gateway.** Chỉ gửi prompt được cung cấp — bỏ qua transcript, khởi động AGENTS, lắp ráp context-engine, công cụ và máy chủ MCP đi kèm, nhưng vẫn kiểm tra định tuyến Gateway, xác thực và lựa chọn provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Thử chế độ tinh gọn.** Nếu cả hai phép dò đều đạt nhưng lượt tác tử thật thất bại với lệnh gọi công cụ sai định dạng hoặc prompt quá lớn, hãy bật `agents.defaults.experimental.localModelLean: true`. Tùy chọn này bỏ ba công cụ mặc định nặng nhất (`browser`, `cron`, `message`) để hình dạng prompt nhỏ hơn và ít giòn hơn. Xem [Tính năng thử nghiệm → Chế độ tinh gọn cho mô hình cục bộ](/vi/concepts/experimental-features#local-model-lean-mode) để biết giải thích đầy đủ, thời điểm nên dùng và cách xác nhận tùy chọn đã bật.

4. **Tắt hoàn toàn công cụ như phương án cuối cùng.** Nếu chế độ tinh gọn vẫn chưa đủ, đặt `models.providers.<provider>.models[].compat.supportsTools: false` cho mục mô hình đó. Khi đó tác tử sẽ hoạt động trên mô hình đó mà không dùng lệnh gọi công cụ.

5. **Sau điểm đó, nút thắt nằm ở thượng nguồn.** Nếu backend vẫn chỉ thất bại trên các lượt chạy OpenClaw lớn hơn sau khi đã bật chế độ tinh gọn và `supportsTools: false`, vấn đề còn lại thường là năng lực mô hình hoặc máy chủ ở thượng nguồn — cửa sổ ngữ cảnh, bộ nhớ GPU, loại bỏ kv-cache hoặc lỗi backend. Tại thời điểm đó, đây không phải là tầng truyền tải của OpenClaw.

## Khắc phục sự cố

- Gateway có thể truy cập proxy không? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio đã bị dỡ tải? Tải lại; khởi động nguội là nguyên nhân "treo" phổ biến.
- Máy chủ cục bộ báo `terminated`, `ECONNRESET`, hoặc đóng stream giữa lượt?
  OpenClaw ghi lại `model.call.error.failureKind` có độ đa dạng thấp cùng ảnh chụp RSS/heap của tiến trình OpenClaw trong chẩn đoán. Với áp lực bộ nhớ của LM Studio/Ollama, đối chiếu dấu thời gian đó với nhật ký máy chủ hoặc nhật ký crash /
  jetsam của macOS để xác nhận liệu máy chủ mô hình có bị kết thúc hay không.
- OpenClaw suy ra ngưỡng kiểm tra trước cửa sổ ngữ cảnh từ cửa sổ mô hình đã phát hiện, hoặc từ cửa sổ mô hình chưa giới hạn khi `agents.defaults.contextTokens` hạ cửa sổ hiệu dụng. Nó cảnh báo dưới 20% với sàn **8k**. Chặn cứng dùng ngưỡng 10% với sàn **4k**, được giới hạn theo cửa sổ ngữ cảnh hiệu dụng để metadata mô hình quá lớn không thể từ chối một mức giới hạn người dùng vốn hợp lệ. Nếu gặp kiểm tra trước này, hãy tăng giới hạn ngữ cảnh của máy chủ/mô hình hoặc chọn mô hình lớn hơn.
- Lỗi ngữ cảnh? Hạ `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- Máy chủ tương thích OpenAI trả về `messages[].content ... expected a string`?
  Thêm `compat.requiresStringContent: true` vào mục mô hình đó.
- Các lệnh gọi `/v1/chat/completions` nhỏ trực tiếp hoạt động, nhưng `openclaw infer model run --local`
  thất bại trên Gemma hoặc mô hình cục bộ khác? Trước tiên hãy kiểm tra URL provider, tham chiếu mô hình, dấu xác thực và nhật ký máy chủ; `model run` cục bộ không bao gồm công cụ tác tử.
  Nếu `model run` cục bộ thành công nhưng các lượt tác tử lớn hơn thất bại, hãy giảm bề mặt công cụ của tác tử bằng `localModelLean` hoặc `compat.supportsTools: false`.
- Lệnh gọi công cụ xuất hiện dưới dạng văn bản JSON/XML/ReAct thô, hoặc provider trả về mảng `tool_calls` rỗng? Đừng thêm một proxy chuyển đổi mù quáng văn bản của trợ lý thành thực thi công cụ. Trước tiên hãy sửa chat template/parser của máy chủ. Nếu mô hình chỉ hoạt động khi bắt buộc dùng công cụ, hãy thêm ghi đè theo từng mô hình `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục mô hình đó cho các phiên mà mọi lượt đều dự kiến có lệnh gọi công cụ.
- An toàn: mô hình cục bộ bỏ qua bộ lọc phía provider; giữ tác tử hẹp và bật compaction để giới hạn phạm vi ảnh hưởng của prompt injection.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Chuyển dự phòng mô hình](/vi/concepts/model-failover)
