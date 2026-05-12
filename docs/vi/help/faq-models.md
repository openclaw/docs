---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều thất bại"
    - Tìm hiểu hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: giá trị mặc định của mô hình, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-05-12T04:10:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  Q&A về model và auth profile. Để thiết lập, phiên, Gateway, kênh và
  khắc phục sự cố, xem [FAQ](/vi/help/faq) chính.

  ## Model: mặc định, lựa chọn, bí danh, chuyển đổi

  <AccordionGroup>
  <Accordion title='“Model mặc định” là gì?'>
    Model mặc định của OpenClaw là bất cứ model nào bạn đặt tại:

    ```
    agents.defaults.model.primary
    ```

    Model được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `anthropic/claude-sonnet-4-6`). Nếu bạn bỏ qua provider, OpenClaw trước tiên thử một bí danh, sau đó thử một kết quả khớp provider đã cấu hình duy nhất cho đúng model id đó, và chỉ sau đó mới quay về provider mặc định đã cấu hình như một đường dẫn tương thích đã không còn được khuyến nghị. Nếu provider đó không còn cung cấp model mặc định đã cấu hình, OpenClaw quay về provider/model đã cấu hình đầu tiên thay vì hiển thị một mặc định provider đã bị xóa và lỗi thời. Bạn vẫn nên đặt `provider/model` **một cách tường minh**.

  </Accordion>

  <Accordion title="Bạn khuyến nghị model nào?">
    **Mặc định được khuyến nghị:** dùng model thế hệ mới nhất mạnh nhất có trong ngăn xếp provider của bạn.
    **Với agent dùng công cụ hoặc đầu vào không đáng tin cậy:** ưu tiên sức mạnh model hơn chi phí.
    **Với chat thường lệ/rủi ro thấp:** dùng các model dự phòng rẻ hơn và định tuyến theo vai trò agent.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Model cục bộ](/vi/gateway/local-models).

    Quy tắc kinh nghiệm: dùng **model tốt nhất bạn có thể chi trả** cho công việc quan trọng, và một
    model rẻ hơn cho chat thường lệ hoặc tóm tắt. Bạn có thể định tuyến model theo từng agent và dùng sub-agent để
    song song hóa các tác vụ dài (mỗi sub-agent tiêu thụ token). Xem [Model](/vi/concepts/models) và
    [Sub-agent](/vi/tools/subagents).

    Cảnh báo mạnh: các model yếu hơn/bị lượng tử hóa quá mức dễ bị prompt
    injection và hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Ngữ cảnh thêm: [Model](/vi/concepts/models).

  </Accordion>

  <Accordion title="Làm thế nào để chuyển model mà không xóa sạch cấu hình?">
    Dùng **lệnh model** hoặc chỉ chỉnh sửa các trường **model**. Tránh thay thế toàn bộ cấu hình.

    Các tùy chọn an toàn:

    - `/model` trong chat (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình model)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn có ý định thay thế toàn bộ cấu hình.
    Với chỉnh sửa RPC, kiểm tra bằng `config.schema.lookup` trước và ưu tiên `config.patch`. Payload lookup cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông, và tóm tắt các phần con trực tiếp
    cho cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Model](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Config](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng model tự host (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là đường dẫn dễ nhất cho model cục bộ.

    Thiết lập nhanh nhất:

    1. Cài Ollama từ `https://ollama.com/download`
    2. Kéo một model cục bộ như `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng model đám mây, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn các model đám mây cùng với các model Ollama cục bộ của bạn
    - các model đám mây như `kimi-k2.5:cloud` không cần kéo về cục bộ
    - để chuyển thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các model nhỏ hơn hoặc bị lượng tử hóa nặng dễ bị prompt
    injection hơn. Chúng tôi đặc biệt khuyến nghị **model lớn** cho mọi bot có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng model nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Model cục bộ](/vi/gateway/local-models),
    [Provider model](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill dùng model nào?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị provider cố định.
    - Kiểm tra thiết lập runtime hiện tại trên từng Gateway bằng `openclaw models status`.
    - Với agent nhạy cảm về bảo mật/dùng công cụ, hãy dùng model thế hệ mới nhất mạnh nhất có sẵn.

  </Accordion>

  <Accordion title="Làm thế nào để chuyển model tức thì (không cần khởi động lại)?">
    Dùng lệnh `/model` như một tin nhắn độc lập:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Đây là các bí danh tích hợp. Có thể thêm bí danh tùy chỉnh qua `agents.defaults.models`.

    Bạn có thể liệt kê các model có sẵn bằng `/model`, `/model list`, hoặc `/model status`.

    `/model` (và `/model list`) hiển thị bộ chọn nhỏ gọn, được đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể ép dùng một auth profile cụ thể cho provider (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị agent nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng, và auth profile nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint provider đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

    **Làm thế nào để bỏ ghim một profile tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay về mặc định, chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận auth profile nào đang hoạt động.

  </Accordion>

  <Accordion title="Nếu hai provider cung cấp cùng một model id, /model dùng provider nào?">
    `/model provider/model` chọn chính xác tuyến provider đó cho phiên.

    Ví dụ, `qianfan/deepseek-v4-flash` và `deepseek/deepseek-v4-flash` là các tham chiếu model khác nhau dù cả hai đều chứa `deepseek-v4-flash`. OpenClaw không nên âm thầm chuyển từ provider này sang provider kia chỉ vì model id rút gọn khớp.

    Một tham chiếu `/model` do người dùng chọn cũng nghiêm ngặt với chính sách fallback. Nếu provider/model đã chọn đó không khả dụng, phản hồi sẽ lỗi một cách rõ ràng thay vì trả lời từ `agents.defaults.model.fallbacks`. Chuỗi fallback đã cấu hình vẫn áp dụng cho mặc định đã cấu hình, primary của Cron job, và trạng thái fallback được tự động chọn.

    Nếu một lượt chạy bắt đầu từ override không theo phiên được phép dùng fallback, OpenClaw thử provider/model được yêu cầu trước, sau đó các fallback đã cấu hình, và chỉ sau đó mới đến primary đã cấu hình. Điều đó ngăn các model id rút gọn trùng lặp nhảy thẳng về provider mặc định.

    Xem [Model](/vi/concepts/models) và [Chuyển đổi dự phòng model](/vi/concepts/model-failover).

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 cho lập trình không?">
    Có. Hãy tách riêng lựa chọn model và lựa chọn runtime:

    - **Agent lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5`. Đăng nhập bằng `openclaw models auth login --provider openai-codex` khi bạn muốn dùng xác thực gói đăng ký ChatGPT/Codex.
    - **Tác vụ OpenAI API trực tiếp bên ngoài vòng lặp agent:** cấu hình `OPENAI_API_KEY` cho hình ảnh, embedding, giọng nói, realtime và các bề mặt OpenAI API không phải agent khác.
    - **Xác thực khóa API agent OpenAI:** dùng `/model openai/gpt-5.5` với một profile khóa API `openai-codex` có thứ tự.
    - **Sub-agent:** định tuyến tác vụ lập trình đến một agent tập trung vào Codex với model `openai/gpt-5.5` riêng.

    Xem [Model](/vi/concepts/models) và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để cấu hình chế độ nhanh cho GPT 5.5?">
    Dùng chuyển đổi theo phiên hoặc mặc định cấu hình:

    - **Theo từng phiên:** gửi `/fast on` trong khi phiên đang dùng `openai/gpt-5.5`.
    - **Mặc định theo từng model:** đặt `agents.defaults.models["openai/gpt-5.5"].params.fastMode` thành `true`.

    Ví dụ:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses gốc được hỗ trợ. Override `/fast` của phiên thắng mặc định cấu hình.

    Xem [Suy nghĩ và chế độ nhanh](/vi/tools/thinking) và [Chế độ nhanh OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Model ... is not allowed" rồi không có phản hồi?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và mọi
    override phiên. Chọn một model không nằm trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lỗi đó được trả về **thay vì** một phản hồi bình thường. Cách sửa: thêm đúng model vào
    `agents.defaults.models`, thêm wildcard provider như `"provider/*": {}` cho danh mục provider động, xóa danh sách cho phép, hoặc chọn một model từ `/model list`.
    Nếu lệnh cũng bao gồm `--runtime codex`, hãy cập nhật danh sách cho phép trước rồi thử lại
    cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này có nghĩa là **provider chưa được cấu hình** (không tìm thấy cấu hình provider MiniMax hoặc auth
    profile), nên không thể phân giải model.

    Checklist sửa lỗi:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ source `main`), rồi khởi động lại Gateway.
    2. Đảm bảo MiniMax đã được cấu hình (wizard hoặc JSON), hoặc auth MiniMax
       tồn tại trong env/auth profile để provider khớp có thể được chèn vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc OAuth MiniMax
       đã lưu cho `minimax-portal`).
    3. Dùng đúng model id (phân biệt chữ hoa chữ thường) cho đường dẫn auth của bạn:
       `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed` cho thiết lập
       khóa API, hoặc `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` cho thiết lập OAuth.
    4. Chạy:

       ```bash
       openclaw models list
       ```

       và chọn từ danh sách (hoặc `/model list` trong chat).

    Xem [MiniMax](/vi/providers/minimax) và [Model](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể dùng MiniMax làm mặc định và OpenAI cho tác vụ phức tạp không?">
    Có. Dùng **MiniMax làm mặc định** và chuyển model **theo từng phiên** khi cần.
    Fallback là dành cho **lỗi**, không phải “tác vụ khó,” vì vậy hãy dùng `/model` hoặc một agent riêng.

    **Tùy chọn A: chuyển theo từng phiên**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sau đó:

    ```
    /model gpt
    ```

    **Tùy chọn B: agent riêng**

    - Mặc định Agent A: MiniMax
    - Mặc định Agent B: OpenAI
    - Định tuyến theo agent hoặc dùng `/agent` để chuyển

    Tài liệu: [Model](/vi/concepts/models), [Định tuyến đa agent](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải lối tắt tích hợp không?">
    Có. OpenClaw đi kèm một vài dạng viết tắt mặc định (chỉ được áp dụng khi model tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt bí danh riêng có cùng tên, giá trị của bạn sẽ được ưu tiên.

  </Accordion>

  <Accordion title="Làm thế nào để định nghĩa/ghi đè lối tắt mô hình (bí danh)?">
    Bí danh đến từ `agents.defaults.models.<modelId>.alias`. Ví dụ:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) sẽ phân giải thành ID mô hình đó.

  </Accordion>

  <Accordion title="Làm thế nào để thêm mô hình từ các nhà cung cấp khác như OpenRouter hoặc Z.AI?">
    OpenRouter (trả tiền theo token; nhiều mô hình):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (mô hình GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Nếu bạn tham chiếu một nhà cung cấp/mô hình nhưng thiếu khóa nhà cung cấp bắt buộc, bạn sẽ gặp lỗi xác thực khi chạy (ví dụ: `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm agent mới**

    Điều này thường có nghĩa là **agent mới** có kho xác thực trống. Xác thực là theo từng agent và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các cách khắc phục:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của agent chính sang kho xác thực của agent mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ agent mới khi agent đó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên qua agent mặc định/chính mà không cần sao chép refresh token.

    Không **được** tái sử dụng `agentDir` giữa các agent; điều đó gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Chuyển dự phòng hoạt động như thế nào?">
    Chuyển dự phòng diễn ra theo hai giai đoạn:

    1. **Luân phiên hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian tạm ngưng áp dụng cho các hồ sơ gặp lỗi (backoff lũy thừa), nên OpenClaw vẫn có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều hơn các phản hồi `429` thuần túy. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    theo cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là các giới hạn
    tốc độ đáng để chuyển dự phòng.

    Một số phản hồi trông giống lỗi thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu một nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ lỗi đó trong
    làn thanh toán, nhưng các bộ khớp văn bản riêng theo nhà cung cấp vẫn chỉ nằm trong phạm vi
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống một cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải vô hiệu hóa thanh toán dài hạn.

    Lỗi tràn ngữ cảnh thì khác: các dấu hiệu như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` sẽ đi theo đường Compaction/thử lại thay vì chuyển sang dự phòng mô hình
    tiếp theo.

    Văn bản lỗi máy chủ chung được cố ý thu hẹp hơn "bất kỳ thứ gì có
    unknown/error trong đó". OpenClaw vẫn xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic trần `An unknown error occurred`, OpenRouter trần
    `Provider returned error`, các lỗi lý do dừng như `Unhandled stop reason:
    error`, payload JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và các lỗi nhà cung cấp đang bận như `ModelNotReadyException` là
    tín hiệu timeout/quá tải đáng để chuyển dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn được xử lý thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" nghĩa là gì?'>
    Điều đó có nghĩa là hệ thống đã cố dùng ID hồ sơ xác thực `anthropic:default`, nhưng không tìm thấy thông tin xác thực cho hồ sơ đó trong kho xác thực dự kiến.

    **Danh sách kiểm tra khắc phục:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới so với đường dẫn cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, Gateway có thể không kế thừa biến đó. Hãy đặt nó trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh sửa đúng agent**
      - Thiết lập nhiều agent nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và nhà cung cấp đã được xác thực hay chưa.

    **Danh sách kiểm tra khắc phục cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là lượt chạy bị ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không thể tìm thấy hồ sơ đó trong kho xác thực của nó.

    - **Dùng Claude CLI**
      - Chạy `openclaw models auth login --provider anthropic --method cli --set-default` trên máy chủ gateway.
    - **Nếu bạn muốn dùng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ gateway**.
      - Xóa mọi thứ tự đã ghim đang buộc dùng một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ gateway**
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy gateway, không phải laptop của bạn.

  </Accordion>

  <Accordion title="Tại sao hệ thống cũng thử Google Gemini và thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm dự phòng (hoặc bạn đã chuyển sang cách viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Cách khắc phục: cung cấp xác thực Google, hoặc xóa/tránh mô hình Google trong `agents.defaults.model.fallbacks` / bí danh để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: cần chữ ký thinking (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **khối thinking không có chữ ký** (thường từ
    một luồng bị hủy/dở dang). Google Antigravity yêu cầu chữ ký cho các khối thinking.

    Cách khắc phục: OpenClaw hiện loại bỏ các khối thinking chưa ký cho Google Antigravity Claude. Nếu lỗi vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho agent đó.

  </Accordion>
</AccordionGroup>

## Hồ sơ xác thực: chúng là gì và cách quản lý

Liên quan: [/concepts/oauth](/vi/concepts/oauth) (luồng OAuth, lưu trữ token, mẫu nhiều tài khoản)

<AccordionGroup>
  <Accordion title="Hồ sơ xác thực là gì?">
    Hồ sơ xác thực là một bản ghi thông tin xác thực có tên (OAuth hoặc khóa API) gắn với một nhà cung cấp. Hồ sơ nằm trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Để kiểm tra các hồ sơ đã lưu mà không in ra bí mật, hãy chạy `openclaw models auth list` (tùy chọn `--provider <id>` hoặc `--json`). Xem [CLI mô hình](/vi/cli/models#auth-profiles) để biết chi tiết.

  </Accordion>

  <Accordion title="Các ID hồ sơ điển hình là gì?">
    OpenClaw dùng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có danh tính email)
    - `anthropic:<email>` cho danh tính OAuth
    - ID tùy chỉnh bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ metadata tùy chọn cho hồ sơ và một thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Điều này **không** lưu bí mật; nó ánh xạ ID tới nhà cung cấp/chế độ và đặt thứ tự luân phiên.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu hồ sơ đó đang trong **thời gian tạm ngưng** ngắn (giới hạn tốc độ/timeout/lỗi xác thực) hoặc trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra điều này, hãy chạy `openclaw models status --json` và xem `auth.unusableProfiles`. Tinh chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian tạm ngưng do giới hạn tốc độ có thể được đặt theo phạm vi mô hình. Một hồ sơ đang tạm ngưng
    cho một mô hình vẫn có thể dùng được cho một mô hình cùng nhóm trên cùng nhà cung cấp,
    trong khi cửa sổ thanh toán/vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

    Bạn cũng có thể đặt ghi đè thứ tự **theo từng agent** (lưu trong `auth-state.json` của agent đó) qua CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Để nhắm tới một agent cụ thể:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Để xác minh thực tế sẽ thử những gì, hãy dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ khỏi thứ tự rõ ràng, probe sẽ báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth so với khóa API - khác nhau ở điểm nào?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập theo gói đăng ký (khi áp dụng).
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [FAQ](/vi/help/faq) — FAQ chính
- [FAQ — bắt đầu nhanh và thiết lập lần đầu](/vi/help/faq-first-run)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Dự phòng mô hình](/vi/concepts/model-failover)
