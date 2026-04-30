---
read_when:
    - Bạn muốn phục vụ các mô hình từ máy GPU của riêng mình
    - Bạn đang kết nối LM Studio hoặc một proxy tương thích với OpenAI
    - Bạn cần hướng dẫn an toàn nhất về mô hình cục bộ
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, điểm cuối OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-04-30T09:36:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Local có thể làm được, nhưng OpenClaw kỳ vọng ngữ cảnh lớn + các lớp phòng vệ mạnh chống prompt injection. Card nhỏ làm cắt ngắn ngữ cảnh và giảm độ an toàn. Hãy nhắm cao: **≥2 Mac Studio cấu hình tối đa hoặc giàn GPU tương đương (~$30k+)**. Một GPU **24 GB** chỉ phù hợp với prompt nhẹ hơn và độ trễ cao hơn. Dùng **biến thể mô hình lớn nhất / đầy đủ kích thước mà bạn có thể chạy**; checkpoint bị lượng tử hóa mạnh hoặc “nhỏ” làm tăng rủi ro prompt-injection (xem [Bảo mật](/vi/gateway/security)).

Nếu bạn muốn thiết lập cục bộ ít ma sát nhất, hãy bắt đầu với [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`. Trang này là hướng dẫn có chủ đích cho các stack cục bộ cao cấp hơn và máy chủ cục bộ tùy chỉnh tương thích OpenAI.

<Warning>
**Người dùng WSL2 + Ollama + NVIDIA/CUDA:** Trình cài đặt Ollama Linux chính thức bật một dịch vụ systemd với `Restart=always`. Trên các thiết lập GPU WSL2, tự khởi động có thể tải lại mô hình cuối cùng trong lúc khởi động và ghim bộ nhớ máy chủ. Nếu VM WSL2 của bạn liên tục khởi động lại sau khi bật Ollama, xem [vòng lặp sập WSL2](/vi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)

Stack cục bộ tốt nhất hiện tại. Tải một mô hình lớn trong LM Studio (ví dụ: bản dựng Qwen, DeepSeek hoặc Llama đầy đủ kích thước), bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`), và dùng Responses API để giữ phần suy luận tách biệt khỏi văn bản cuối cùng.

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
- Trong LM Studio, tải xuống **bản dựng mô hình lớn nhất hiện có** (tránh các biến thể “nhỏ”/bị lượng tử hóa nặng), khởi động máy chủ, xác nhận `http://127.0.0.1:1234/v1/models` liệt kê mô hình đó.
- Thay `my-local-model` bằng ID mô hình thực tế được hiển thị trong LM Studio.
- Giữ mô hình đã tải; tải nguội sẽ thêm độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn khác.
- Với WhatsApp, hãy dùng Responses API để chỉ văn bản cuối cùng được gửi.

Giữ cấu hình các mô hình được lưu trữ ngay cả khi chạy cục bộ; dùng `models.mode: "merge"` để các phương án dự phòng vẫn khả dụng.

### Cấu hình lai: chính được lưu trữ, dự phòng cục bộ

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

### Ưu tiên cục bộ với phương án an toàn được lưu trữ

Đổi thứ tự mô hình chính và dự phòng; giữ nguyên khối providers và `models.mode: "merge"` để bạn có thể dự phòng về Sonnet hoặc Opus khi máy cục bộ ngừng hoạt động.

### Lưu trữ theo khu vực / định tuyến dữ liệu

- Các biến thể MiniMax/Kimi/GLM được lưu trữ cũng có trên OpenRouter với endpoint ghim theo khu vực (ví dụ: lưu trữ tại Hoa Kỳ). Chọn biến thể khu vực ở đó để giữ lưu lượng trong phạm vi pháp lý bạn chọn trong khi vẫn dùng `models.mode: "merge"` cho các dự phòng Anthropic/OpenAI.
- Chỉ cục bộ vẫn là hướng bảo mật riêng tư mạnh nhất; định tuyến khu vực được lưu trữ là lựa chọn trung gian khi bạn cần tính năng của nhà cung cấp nhưng muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ khác tương thích OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy, hoặc Gateway tùy chỉnh hoạt động nếu chúng cung cấp endpoint kiểu OpenAI `/v1/chat/completions`. Dùng bộ chuyển đổi Chat Completions trừ khi backend ghi rõ hỗ trợ `/v1/responses`. Thay khối provider ở trên bằng endpoint và ID mô hình của bạn:

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

Nếu `api` bị bỏ qua trên một provider tùy chỉnh có `baseUrl`, OpenClaw mặc định dùng `openai-completions`. Các endpoint loopback như `127.0.0.1` được tin cậy tự động; endpoint LAN, tailnet, và DNS riêng vẫn cần `request.allowPrivateNetwork: true`.

Giá trị `models.providers.<id>.models[].id` là cục bộ theo provider. Không bao gồm tiền tố provider ở đó. Ví dụ, một máy chủ MLX được khởi động bằng `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` nên dùng ID danh mục và tham chiếu mô hình này:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình thị giác cục bộ hoặc qua proxy để tệp đính kèm hình ảnh được đưa vào lượt agent. Onboarding provider tùy chỉnh tương tác suy luận các ID mô hình thị giác phổ biến và chỉ hỏi với tên không rõ. Onboarding không tương tác dùng cùng suy luận đó; dùng `--custom-image-input` cho ID thị giác không rõ hoặc `--custom-text-input` khi một mô hình trông có vẻ đã biết chỉ là văn bản phía sau endpoint của bạn.

Giữ `models.mode: "merge"` để các mô hình được lưu trữ vẫn khả dụng làm dự phòng. Dùng `models.providers.<id>.timeoutSeconds` cho máy chủ mô hình cục bộ hoặc từ xa chậm trước khi tăng `agents.defaults.timeoutSeconds`. Thời gian chờ provider chỉ áp dụng cho yêu cầu HTTP mô hình, bao gồm kết nối, header, truyền body theo luồng, và tổng thời gian hủy guarded-fetch.

<Note>
Với provider tùy chỉnh tương thích OpenAI, việc lưu một dấu mốc cục bộ không bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` phân giải thành loopback, LAN riêng, `.local`, hoặc hostname trần. OpenClaw xem đó là thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Dùng giá trị thật cho bất kỳ provider nào chấp nhận hostname công khai.
</Note>

Ghi chú hành vi cho backend `/v1` cục bộ/qua proxy:

- OpenClaw xem chúng là tuyến tương thích OpenAI kiểu proxy, không phải endpoint OpenAI gốc
- định hình yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây: không có `service_tier`, không có Responses `store`, không có định hình payload tương thích reasoning của OpenAI, và không có gợi ý prompt-cache
- header ghi nhận OpenClaw ẩn (`originator`, `version`, `User-Agent`) không được chèn vào các URL proxy tùy chỉnh này

Ghi chú tương thích cho backend tương thích OpenAI nghiêm ngặt hơn:

- Một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi trên Chat Completions, không chấp nhận mảng phần nội dung có cấu trúc. Đặt `models.providers.<provider>.models[].compat.requiresStringContent: true` cho các endpoint đó.
- Một số mô hình cục bộ phát ra yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn `[tool_name]` theo sau bởi JSON và `[END_TOOL_REQUEST]`. OpenClaw chỉ nâng chúng thành lời gọi công cụ thật khi tên khớp chính xác với một công cụ đã đăng ký cho lượt đó; nếu không, khối này được xem là văn bản không được hỗ trợ và bị ẩn khỏi câu trả lời hiển thị cho người dùng.
- Nếu một mô hình phát ra JSON, XML, hoặc văn bản kiểu ReAct trông giống một lời gọi công cụ nhưng provider không phát ra một invocation có cấu trúc, OpenClaw giữ nó dưới dạng văn bản và ghi cảnh báo với run id, provider/model, mẫu đã phát hiện, và tên công cụ khi có. Hãy xem đó là sự không tương thích tool-call của provider/model, không phải một lượt chạy công cụ đã hoàn tất.
- Nếu công cụ xuất hiện dưới dạng văn bản assistant thay vì chạy, ví dụ JSON thô, XML, cú pháp ReAct, hoặc một mảng `tool_calls` rỗng trong phản hồi provider, trước tiên hãy xác minh máy chủ đang dùng chat template/parser có khả năng tool-call. Với backend Chat Completions tương thích OpenAI có parser chỉ hoạt động khi bắt buộc dùng công cụ, hãy đặt override yêu cầu theo từng mô hình thay vì dựa vào phân tích văn bản:

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

  Chỉ dùng cách này cho mô hình/phiên mà mọi lượt bình thường đều nên gọi công cụ. Nó ghi đè giá trị proxy mặc định của OpenClaw là `tool_choice: "auto"`. Thay `local/my-local-model` bằng tham chiếu provider/model chính xác được hiển thị bởi `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận nỗ lực reasoning của OpenAI vượt ngoài hồ sơ tích hợp sẵn, hãy khai báo chúng trên khối compat của mô hình. Thêm `"xhigh"` ở đây khiến `/think xhigh`, bộ chọn phiên, xác thực Gateway, và xác thực `llm-task` hiển thị mức đó cho tham chiếu provider/model đã cấu hình:

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

- Một số backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không ổn định với hình dạng prompt đầy đủ của agent-runtime trong OpenClaw, đặc biệt khi schema công cụ được bao gồm. Trước tiên hãy xác minh đường dẫn provider bằng phép thử cục bộ gọn nhẹ:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Để xác minh tuyến Gateway mà không dùng hình dạng prompt đầy đủ của agent, hãy dùng phép thử mô hình Gateway thay thế:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Cả phép thử mô hình cục bộ và Gateway chỉ gửi prompt đã cung cấp. Phép thử Gateway vẫn xác thực định tuyến Gateway, auth, và lựa chọn provider, nhưng nó chủ ý bỏ qua transcript phiên trước đó, ngữ cảnh AGENTS/bootstrap, lắp ráp context-engine, công cụ, và máy chủ MCP đi kèm.

  Nếu thao tác đó thành công nhưng các lượt tác nhân OpenClaw thông thường thất bại, trước tiên hãy thử
  `agents.defaults.experimental.localModelLean: true` để bỏ các công cụ mặc định
  nặng như `browser`, `cron` và `message`; đây là một cờ thử nghiệm,
  không phải thiết lập chế độ mặc định ổn định. Xem
  [Tính năng thử nghiệm](/vi/concepts/experimental-features). Nếu vẫn thất bại, hãy thử
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Nếu backend vẫn chỉ thất bại trên các lượt chạy OpenClaw lớn hơn, vấn đề còn lại
  thường là dung lượng mô hình/máy chủ upstream hoặc lỗi backend, không phải tầng
  truyền tải của OpenClaw.

## Khắc phục sự cố

- Gateway có thể truy cập proxy không? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio đã bị dỡ tải? Tải lại; khởi động nguội là nguyên nhân “treo” phổ biến.
- Máy chủ cục bộ báo `terminated`, `ECONNRESET`, hoặc đóng luồng giữa lượt?
  OpenClaw ghi lại một `model.call.error.failureKind` có số lượng giá trị thấp cùng
  ảnh chụp nhanh RSS/heap của tiến trình OpenClaw trong chẩn đoán. Với áp lực bộ nhớ
  LM Studio/Ollama, hãy đối chiếu dấu thời gian đó với log máy chủ hoặc log sự cố /
  jetsam của macOS để xác nhận máy chủ mô hình có bị kết thúc hay không.
- OpenClaw suy ra ngưỡng kiểm tra trước cửa sổ ngữ cảnh từ cửa sổ mô hình được phát hiện, hoặc từ cửa sổ mô hình không bị giới hạn khi `agents.defaults.contextTokens` hạ thấp cửa sổ hiệu dụng. OpenClaw cảnh báo dưới 20% với mức sàn **8k**. Chặn cứng dùng ngưỡng 10% với mức sàn **4k**, được giới hạn theo cửa sổ ngữ cảnh hiệu dụng để siêu dữ liệu mô hình quá lớn không thể từ chối một giới hạn người dùng vốn hợp lệ. Nếu gặp kiểm tra trước đó, hãy tăng giới hạn ngữ cảnh của máy chủ/mô hình hoặc chọn mô hình lớn hơn.
- Lỗi ngữ cảnh? Hạ `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- Máy chủ tương thích OpenAI trả về `messages[].content ... expected a string`?
  Thêm `compat.requiresStringContent: true` vào mục mô hình đó.
- Các lệnh gọi `/v1/chat/completions` nhỏ trực tiếp hoạt động, nhưng `openclaw infer model run --local`
  thất bại trên Gemma hoặc mô hình cục bộ khác? Trước tiên hãy kiểm tra URL nhà cung cấp, tham chiếu mô hình, dấu hiệu xác thực
  và log máy chủ; `model run` cục bộ không bao gồm công cụ tác nhân.
  Nếu `model run` cục bộ thành công nhưng các lượt tác nhân lớn hơn thất bại, hãy giảm bề mặt công cụ tác nhân
  bằng `localModelLean` hoặc `compat.supportsTools: false`.
- Lệnh gọi công cụ xuất hiện dưới dạng văn bản JSON/XML/ReAct thô, hoặc nhà cung cấp trả về
  mảng `tool_calls` rỗng? Đừng thêm proxy chuyển đổi mù quáng văn bản của trợ lý
  thành thực thi công cụ. Trước tiên hãy sửa chat template/parser của máy chủ. Nếu
  mô hình chỉ hoạt động khi bắt buộc dùng công cụ, hãy thêm ghi đè theo từng mô hình
  `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục mô hình đó
  cho các phiên mà mọi lượt đều dự kiến có lệnh gọi công cụ.
- An toàn: mô hình cục bộ bỏ qua bộ lọc phía nhà cung cấp; giữ phạm vi tác nhân hẹp và bật Compaction để hạn chế phạm vi ảnh hưởng của prompt injection.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
