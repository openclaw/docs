---
read_when:
    - Bạn muốn cung cấp các mô hình từ máy GPU của riêng mình
    - Bạn đang kết nối LM Studio hoặc một proxy tương thích với OpenAI
    - Bạn cần hướng dẫn an toàn nhất về mô hình cục bộ
summary: Chạy OpenClaw trên các LLM cục bộ (LM Studio, vLLM, LiteLLM, endpoint OpenAI tùy chỉnh)
title: Mô hình cục bộ
x-i18n:
    generated_at: "2026-04-29T22:44:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

Cục bộ là khả thi, nhưng OpenClaw cần ngữ cảnh lớn và các lớp phòng vệ mạnh trước prompt injection. Các card nhỏ sẽ cắt ngắn ngữ cảnh và làm suy yếu độ an toàn. Hãy đặt mục tiêu cao: **≥2 Mac Studios cấu hình tối đa hoặc dàn GPU tương đương (~$30k+)**. Một GPU **24 GB** chỉ phù hợp với các prompt nhẹ hơn và độ trễ cao hơn. Dùng **biến thể mô hình lớn nhất / đầy đủ kích thước mà bạn có thể chạy**; các checkpoint bị lượng tử hóa quá mạnh hoặc “nhỏ” làm tăng rủi ro prompt injection (xem [Bảo mật](/vi/gateway/security)).

Nếu bạn muốn thiết lập cục bộ ít ma sát nhất, hãy bắt đầu với [LM Studio](/vi/providers/lmstudio) hoặc [Ollama](/vi/providers/ollama) và `openclaw onboard`. Trang này là hướng dẫn có chủ kiến cho các stack cục bộ cao cấp hơn và máy chủ cục bộ tương thích OpenAI tùy chỉnh.

<Warning>
**Người dùng WSL2 + Ollama + NVIDIA/CUDA:** Trình cài đặt Ollama Linux chính thức bật một dịch vụ systemd với `Restart=always`. Trên các thiết lập GPU WSL2, tự khởi động có thể tải lại mô hình cuối cùng trong lúc boot và ghim bộ nhớ máy chủ. Nếu VM WSL2 của bạn liên tục khởi động lại sau khi bật Ollama, xem [vòng lặp sập WSL2](/vi/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)

Stack cục bộ tốt nhất hiện nay. Tải một mô hình lớn trong LM Studio (ví dụ: bản dựng Qwen, DeepSeek hoặc Llama đầy đủ kích thước), bật máy chủ cục bộ (mặc định `http://127.0.0.1:1234`), và dùng Responses API để tách riêng suy luận khỏi văn bản cuối cùng.

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
- Thay `my-local-model` bằng ID mô hình thực tế hiển thị trong LM Studio.
- Giữ mô hình đã tải; tải nguội sẽ làm tăng độ trễ khởi động.
- Điều chỉnh `contextWindow`/`maxTokens` nếu bản dựng LM Studio của bạn khác.
- Với WhatsApp, hãy dùng Responses API để chỉ văn bản cuối cùng được gửi.

Giữ cấu hình các mô hình được lưu trữ ngay cả khi chạy cục bộ; dùng `models.mode: "merge"` để các phương án dự phòng vẫn khả dụng.

### Cấu hình lai: chính là hosted, dự phòng là cục bộ

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

Đổi thứ tự chính và dự phòng; giữ nguyên khối providers và `models.mode: "merge"` để bạn có thể chuyển dự phòng sang Sonnet hoặc Opus khi máy cục bộ không hoạt động.

### Hosting theo khu vực / định tuyến dữ liệu

- Các biến thể hosted MiniMax/Kimi/GLM cũng có trên OpenRouter với endpoint được ghim theo khu vực (ví dụ: hosted tại Hoa Kỳ). Chọn biến thể khu vực ở đó để giữ lưu lượng trong phạm vi pháp lý bạn chọn trong khi vẫn dùng `models.mode: "merge"` cho các phương án dự phòng Anthropic/OpenAI.
- Chỉ cục bộ vẫn là hướng bảo mật riêng tư mạnh nhất; định tuyến khu vực hosted là điểm cân bằng khi bạn cần tính năng của nhà cung cấp nhưng muốn kiểm soát luồng dữ liệu.

## Các proxy cục bộ tương thích OpenAI khác

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy hoặc gateway tùy chỉnh hoạt động nếu chúng cung cấp endpoint `/v1/chat/completions` kiểu OpenAI. Dùng bộ chuyển đổi Chat Completions trừ khi backend ghi rõ có hỗ trợ `/v1/responses`. Thay khối provider ở trên bằng endpoint và ID mô hình của bạn:

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

Nếu `api` bị bỏ qua trên provider tùy chỉnh có `baseUrl`, OpenClaw mặc định dùng `openai-completions`. Các endpoint loopback như `127.0.0.1` được tự động tin cậy; các endpoint LAN, tailnet và DNS riêng vẫn cần `request.allowPrivateNetwork: true`.

Giá trị `models.providers.<id>.models[].id` là cục bộ theo provider. Không bao gồm tiền tố provider ở đó. Ví dụ, một máy chủ MLX khởi động bằng `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` nên dùng ID catalog và ref mô hình này:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Đặt `input: ["text", "image"]` trên các mô hình vision cục bộ hoặc qua proxy để tệp đính kèm hình ảnh được chèn vào lượt agent. Onboarding provider tùy chỉnh tương tác sẽ suy luận các ID mô hình vision phổ biến và chỉ hỏi với tên chưa biết. Onboarding không tương tác dùng cùng suy luận đó; dùng `--custom-image-input` cho ID vision chưa biết hoặc `--custom-text-input` khi một mô hình trông như đã biết chỉ hỗ trợ văn bản phía sau endpoint của bạn.

Giữ `models.mode: "merge"` để các mô hình hosted vẫn khả dụng làm phương án dự phòng. Dùng `models.providers.<id>.timeoutSeconds` cho máy chủ mô hình cục bộ hoặc từ xa chậm trước khi tăng `agents.defaults.timeoutSeconds`. Timeout của provider chỉ áp dụng cho các yêu cầu HTTP mô hình, bao gồm kết nối, header, streaming body và toàn bộ abort được guarded-fetch bảo vệ.

<Note>
Với provider tùy chỉnh tương thích OpenAI, việc lưu một marker cục bộ không bí mật như `apiKey: "ollama-local"` được chấp nhận khi `baseUrl` phân giải tới loopback, LAN riêng, `.local` hoặc hostname trần. OpenClaw xem đó là thông tin xác thực cục bộ hợp lệ thay vì báo thiếu khóa. Dùng giá trị thật cho bất kỳ provider nào chấp nhận hostname công khai.
</Note>

Ghi chú hành vi cho backend `/v1` cục bộ/qua proxy:

- OpenClaw xem các route này là route tương thích OpenAI kiểu proxy, không phải endpoint OpenAI gốc
- định dạng yêu cầu chỉ dành cho OpenAI gốc không áp dụng ở đây: không có `service_tier`, không có Responses `store`, không có định dạng payload tương thích reasoning của OpenAI, và không có gợi ý prompt-cache
- các header ghi nhận OpenClaw ẩn (`originator`, `version`, `User-Agent`) không được chèn vào các URL proxy tùy chỉnh này

Ghi chú tương thích cho các backend tương thích OpenAI nghiêm ngặt hơn:

- Một số máy chủ chỉ chấp nhận `messages[].content` dạng chuỗi trên Chat Completions, không chấp nhận mảng content-part có cấu trúc. Đặt `models.providers.<provider>.models[].compat.requiresStringContent: true` cho các endpoint đó.
- Một số mô hình cục bộ phát ra yêu cầu công cụ độc lập trong ngoặc vuông dưới dạng văn bản, chẳng hạn `[tool_name]` theo sau là JSON và `[END_TOOL_REQUEST]`. OpenClaw chỉ nâng cấp chúng thành lệnh gọi công cụ thật khi tên khớp chính xác với một công cụ đã đăng ký cho lượt đó; nếu không, khối này được xem là văn bản không được hỗ trợ và bị ẩn khỏi phản hồi người dùng nhìn thấy.
- Nếu một mô hình phát ra JSON, XML hoặc văn bản kiểu ReAct trông giống lệnh gọi công cụ nhưng provider không phát ra invocation có cấu trúc, OpenClaw giữ nguyên nó dưới dạng văn bản và ghi cảnh báo kèm run id, provider/model, mẫu đã phát hiện, và tên công cụ khi có. Hãy xem đó là không tương thích tool-call của provider/model, không phải một lần chạy công cụ đã hoàn tất.
- Nếu công cụ xuất hiện dưới dạng văn bản assistant thay vì chạy, ví dụ JSON thô, XML, cú pháp ReAct hoặc một mảng `tool_calls` rỗng trong phản hồi provider, trước tiên hãy xác minh máy chủ đang dùng chat template/parser có khả năng tool-call. Với backend Chat Completions tương thích OpenAI có parser chỉ hoạt động khi tool use bị bắt buộc, hãy đặt override yêu cầu theo từng mô hình thay vì dựa vào phân tích văn bản:

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

  Chỉ dùng cấu hình này cho các mô hình/phiên mà mọi lượt bình thường đều nên gọi công cụ. Nó ghi đè giá trị proxy mặc định của OpenClaw là `tool_choice: "auto"`. Thay `local/my-local-model` bằng ref provider/model chính xác hiển thị bởi `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Nếu một mô hình tùy chỉnh tương thích OpenAI chấp nhận các mức effort reasoning OpenAI ngoài hồ sơ dựng sẵn, hãy khai báo chúng trên khối compat của mô hình. Thêm `"xhigh"` ở đây sẽ khiến `/think xhigh`, bộ chọn phiên, xác thực Gateway và xác thực `llm-task` hiển thị mức này cho ref provider/model đã cấu hình đó:

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

- Một số backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không ổn định với hình dạng prompt agent-runtime đầy đủ của OpenClaw, đặc biệt khi có kèm schema công cụ. Trước tiên hãy xác minh đường dẫn provider bằng probe cục bộ gọn nhẹ:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Để xác minh route Gateway mà không dùng hình dạng prompt agent đầy đủ, hãy dùng probe mô hình Gateway thay vào đó:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Cả probe mô hình cục bộ và Gateway đều chỉ gửi prompt được cung cấp. Probe Gateway vẫn xác thực định tuyến Gateway, auth và lựa chọn provider, nhưng nó cố ý bỏ qua transcript phiên trước đó, ngữ cảnh AGENTS/bootstrap, lắp ráp context-engine, công cụ và các máy chủ MCP đi kèm.

  Nếu thao tác đó thành công nhưng các lượt tác tử OpenClaw bình thường thất bại, trước tiên hãy thử
  `agents.defaults.experimental.localModelLean: true` để loại bỏ các công cụ
  mặc định nặng như `browser`, `cron` và `message`; đây là một cờ thử nghiệm,
  không phải thiết lập chế độ mặc định ổn định. Xem
  [Tính năng thử nghiệm](/vi/concepts/experimental-features). Nếu vẫn thất bại, hãy thử
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Nếu phần phụ trợ vẫn chỉ thất bại trên các lượt chạy OpenClaw lớn hơn, vấn đề còn lại
  thường là dung lượng mô hình/máy chủ thượng nguồn hoặc lỗi phần phụ trợ, không phải
  lớp vận chuyển của OpenClaw.

## Khắc phục sự cố

- Gateway có thể truy cập proxy không? `curl http://127.0.0.1:1234/v1/models`.
- Mô hình LM Studio đã bị dỡ tải? Tải lại; khởi động nguội là một nguyên nhân “treo” phổ biến.
- Máy chủ cục bộ báo `terminated`, `ECONNRESET`, hoặc đóng luồng giữa lượt?
  OpenClaw ghi lại `model.call.error.failureKind` có số lượng giá trị thấp cùng với
  ảnh chụp RSS/heap của tiến trình OpenClaw trong chẩn đoán. Đối với áp lực bộ nhớ
  của LM Studio/Ollama, đối chiếu dấu thời gian đó với nhật ký máy chủ hoặc nhật ký
  sự cố / jetsam của macOS để xác nhận máy chủ mô hình có bị kết thúc hay không.
- OpenClaw cảnh báo khi cửa sổ ngữ cảnh được phát hiện thấp hơn **32k** và chặn khi thấp hơn **16k**. Nếu gặp kiểm tra trước đó, hãy tăng giới hạn ngữ cảnh của máy chủ/mô hình hoặc chọn một mô hình lớn hơn.
- Lỗi ngữ cảnh? Giảm `contextWindow` hoặc tăng giới hạn máy chủ của bạn.
- Máy chủ tương thích OpenAI trả về `messages[].content ... expected a string`?
  Thêm `compat.requiresStringContent: true` vào mục mô hình đó.
- Các lệnh gọi `/v1/chat/completions` rất nhỏ chạy trực tiếp thì hoạt động, nhưng `openclaw infer model run --local`
  thất bại trên Gemma hoặc một mô hình cục bộ khác? Trước tiên hãy kiểm tra URL nhà cung cấp, tham chiếu mô hình, dấu hiệu xác thực
  và nhật ký máy chủ; `model run` cục bộ không bao gồm công cụ của tác tử.
  Nếu `model run` cục bộ thành công nhưng các lượt tác tử lớn hơn thất bại, hãy giảm bề mặt công cụ của tác tử
  bằng `localModelLean` hoặc `compat.supportsTools: false`.
- Lệnh gọi công cụ hiển thị dưới dạng văn bản JSON/XML/ReAct thô, hoặc nhà cung cấp trả về một
  mảng `tool_calls` rỗng? Không thêm proxy chuyển đổi mù quáng văn bản của trợ lý
  thành thực thi công cụ. Trước tiên hãy sửa mẫu/phân tích cú pháp trò chuyện của máy chủ. Nếu
  mô hình chỉ hoạt động khi việc dùng công cụ bị ép buộc, hãy thêm ghi đè theo từng mô hình
  `params.extra_body.tool_choice: "required"` ở trên và chỉ dùng mục mô hình đó
  cho các phiên mà lệnh gọi công cụ được kỳ vọng ở mọi lượt.
- An toàn: mô hình cục bộ bỏ qua bộ lọc phía nhà cung cấp; giữ phạm vi tác tử hẹp và bật compaction để hạn chế phạm vi tác động của chèn prompt.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
