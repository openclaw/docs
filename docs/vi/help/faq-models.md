---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều thất bại"
    - Tìm hiểu hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: giá trị mặc định của mô hình, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-05-06T09:15:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  Câu hỏi thường gặp về mô hình và hồ sơ xác thực. Để thiết lập, phiên, Gateway, kênh và
  khắc phục sự cố, hãy xem [Câu hỏi thường gặp](/vi/help/faq) chính.

  ## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    Mô hình mặc định của OpenClaw là bất cứ mô hình nào bạn đặt làm:

    ```
    agents.defaults.model.primary
    ```

    Mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5`). Nếu bạn bỏ qua nhà cung cấp, trước tiên OpenClaw sẽ thử bí danh, sau đó thử một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng mã mô hình đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình như một đường dẫn tương thích đã lỗi thời. Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một mặc định nhà cung cấp đã bị xóa và cũ. Bạn vẫn nên đặt `provider/model` **một cách tường minh**.

  </Accordion>

  <Accordion title="What model do you recommend?">
    **Mặc định được khuyến nghị:** dùng mô hình thế hệ mới nhất mạnh nhất có sẵn trong hệ nhà cung cấp của bạn.
    **Đối với agent có dùng công cụ hoặc đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Đối với trò chuyện thường lệ/rủi ro thấp:** dùng các mô hình dự phòng rẻ hơn và định tuyến theo vai trò agent.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Mô hình cục bộ](/vi/gateway/local-models).

    Quy tắc thực tế: dùng **mô hình tốt nhất bạn có thể chi trả** cho công việc có rủi ro cao, và một mô hình rẻ hơn
    cho trò chuyện thường lệ hoặc tóm tắt. Bạn có thể định tuyến mô hình theo từng agent và dùng sub-agent để
    song song hóa các tác vụ dài (mỗi sub-agent tiêu thụ token). Xem [Mô hình](/vi/concepts/models) và
    [Sub-agent](/vi/tools/subagents).

    Cảnh báo mạnh: các mô hình yếu hơn/lượng tử hóa quá mức dễ bị prompt
    injection và hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Thêm ngữ cảnh: [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    Dùng **lệnh mô hình** hoặc chỉ chỉnh sửa các trường **mô hình**. Tránh thay thế toàn bộ cấu hình.

    Các tùy chọn an toàn:

    - `/model` trong trò chuyện (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn định thay thế toàn bộ cấu hình.
    Với các chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup` và ưu tiên `config.patch`. Payload tra cứu cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông và tóm tắt con trực tiếp.
    cho các bản cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Cấu hình](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    Có. Ollama là đường dẫn dễ nhất cho mô hình cục bộ.

    Thiết lập nhanh nhất:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ, chẳng hạn `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng mô hình đám mây, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn các mô hình đám mây cùng các mô hình Ollama cục bộ của bạn
    - các mô hình đám mây như `kimi-k2.5:cloud` không cần kéo cục bộ
    - để chuyển đổi thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc bị lượng tử hóa nặng dễ bị prompt
    injection hơn. Chúng tôi đặc biệt khuyến nghị **mô hình lớn** cho bất kỳ bot nào có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng mô hình nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị nhà cung cấp cố định.
    - Kiểm tra thiết lập runtime hiện tại trên từng gateway bằng `openclaw models status`.
    - Với agent nhạy cảm về bảo mật/có dùng công cụ, hãy dùng mô hình thế hệ mới nhất mạnh nhất có sẵn.

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
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

    Đây là các bí danh tích hợp sẵn. Có thể thêm bí danh tùy chỉnh qua `agents.defaults.models`.

    Bạn có thể liệt kê các mô hình có sẵn bằng `/model`, `/model list`, hoặc `/model status`.

    `/model` (và `/model list`) hiển thị một bộ chọn gọn, được đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể buộc một hồ sơ xác thực cụ thể cho nhà cung cấp (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` cho biết agent nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng, và hồ sơ xác thực nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

    **Làm cách nào để bỏ ghim một hồ sơ tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay về mặc định, hãy chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận hồ sơ xác thực nào đang hoạt động.

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    Có. Hãy xem lựa chọn mô hình và lựa chọn runtime là hai việc riêng biệt:

    - **Agent lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5` và `agents.defaults.agentRuntime.id` thành `"codex"`. Đăng nhập bằng `openclaw models auth login --provider openai-codex` khi bạn muốn xác thực thuê bao ChatGPT/Codex.
    - **Tác vụ API OpenAI trực tiếp thông qua PI:** dùng `/model openai/gpt-5.5` mà không ghi đè runtime Codex và cấu hình `OPENAI_API_KEY`.
    - **Codex OAuth thông qua PI:** chỉ dùng `/model openai-codex/gpt-5.5` khi bạn cố ý muốn trình chạy PI bình thường với Codex OAuth.
    - **Sub-agent:** định tuyến tác vụ lập trình tới một agent chỉ dùng Codex với mô hình riêng và mặc định `agentRuntime` riêng.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    Dùng một công tắc phiên hoặc một mặc định cấu hình:

    - **Theo từng phiên:** gửi `/fast on` khi phiên đang dùng `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5`.
    - **Mặc định theo từng mô hình:** đặt `agents.defaults.models["openai/gpt-5.5"].params.fastMode` hoặc `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` thành `true`.

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

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses gốc được hỗ trợ. Ghi đè `/fast` theo phiên sẽ thắng mặc định cấu hình.

    Xem [Tư duy và chế độ nhanh](/vi/tools/thinking) và [chế độ nhanh OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và mọi
    ghi đè phiên. Chọn một mô hình không có trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lỗi đó được trả về **thay vì** một phản hồi bình thường. Cách sửa: thêm mô hình vào
    `agents.defaults.models`, xóa danh sách cho phép, hoặc chọn một mô hình từ `/model list`.
    Nếu lệnh cũng bao gồm `--runtime codex`, hãy thêm mô hình trước rồi thử lại
    cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này nghĩa là **nhà cung cấp chưa được cấu hình** (không tìm thấy cấu hình nhà cung cấp MiniMax hoặc hồ sơ xác thực
    MiniMax), nên không thể phân giải mô hình.

    Danh sách kiểm tra để sửa:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ source `main`), rồi khởi động lại gateway.
    2. Đảm bảo MiniMax đã được cấu hình (trình hướng dẫn hoặc JSON), hoặc xác thực MiniMax
       tồn tại trong env/hồ sơ xác thực để nhà cung cấp khớp có thể được chèn vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc MiniMax
       OAuth đã lưu cho `minimax-portal`).
    3. Dùng đúng mã mô hình (phân biệt chữ hoa chữ thường) cho đường dẫn xác thực của bạn:
       `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed` cho thiết lập
       khóa API, hoặc `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` cho thiết lập OAuth.
    4. Chạy:

       ```bash
       openclaw models list
       ```

       và chọn từ danh sách (hoặc `/model list` trong trò chuyện).

    Xem [MiniMax](/vi/providers/minimax) và [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    Có. Dùng **MiniMax làm mặc định** và chuyển mô hình **theo từng phiên** khi cần.
    Dự phòng dành cho **lỗi**, không phải "tác vụ khó", vì vậy hãy dùng `/model` hoặc một agent riêng.

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

    **Tùy chọn B: agent riêng biệt**

    - Mặc định Agent A: MiniMax
    - Mặc định Agent B: OpenAI
    - Định tuyến theo agent hoặc dùng `/agent` để chuyển

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa agent](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    Có. OpenClaw đi kèm một vài dạng viết tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` cho thiết lập khóa API, hoặc `openai-codex/gpt-5.5` khi được cấu hình cho Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt bí danh riêng với cùng tên, giá trị của bạn sẽ được ưu tiên.

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
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

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) phân giải thành mã mô hình đó.

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
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

    Nếu bạn tham chiếu đến một nhà cung cấp/mô hình nhưng thiếu khóa nhà cung cấp bắt buộc, bạn sẽ gặp lỗi xác thực khi chạy (ví dụ: `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm agent mới**

    Điều này thường có nghĩa là **agent mới** có kho xác thực trống. Xác thực áp dụng theo từng agent và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các tùy chọn khắc phục:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của agent chính vào kho xác thực của agent mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ agent mới khi nó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên tới agent mặc định/chính mà không cần nhân bản refresh token.

    Không **tái sử dụng** `agentDir` giữa các agent; việc đó gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển đổi dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Cơ chế chuyển đổi dự phòng hoạt động như thế nào?">
    Chuyển đổi dự phòng diễn ra qua hai giai đoạn:

    1. **Xoay vòng hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ áp dụng cho các hồ sơ bị lỗi (backoff lũy thừa), vì vậy OpenClaw có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều hơn các phản hồi `429` thuần túy. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là các giới hạn tốc độ
    đáng để chuyển đổi dự phòng.

    Một số phản hồi trông giống liên quan đến thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu một nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ lỗi đó trong
    luồng thanh toán, nhưng các bộ khớp văn bản theo từng nhà cung cấp vẫn được giới hạn trong
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu của tổ chức/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải tắt dài hạn do thanh toán.

    Lỗi tràn ngữ cảnh thì khác: các dấu hiệu như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` vẫn ở đường Compaction/thử lại thay vì chuyển sang
    dự phòng mô hình.

    Văn bản lỗi máy chủ chung được cố ý thu hẹp hơn so với "bất cứ thứ gì có
    unknown/error trong đó". OpenClaw có xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic trần `An unknown error occurred`, OpenRouter trần
    `Provider returned error`, lỗi lý do dừng như `Unhandled stop reason:
    error`, payload JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và lỗi nhà cung cấp đang bận như `ModelNotReadyException` là
    các tín hiệu hết thời gian/quá tải đáng để chuyển đổi dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" có nghĩa là gì?'>
    Điều đó có nghĩa là hệ thống đã cố sử dụng ID hồ sơ xác thực `anthropic:default`, nhưng không thể tìm thấy thông tin xác thực cho nó trong kho xác thực dự kiến.

    **Danh sách kiểm tra khắc phục:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới và cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, nó có thể không kế thừa biến đó. Hãy đặt nó trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh đúng agent**
      - Thiết lập nhiều agent nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và liệu nhà cung cấp đã được xác thực chưa.

    **Danh sách kiểm tra khắc phục cho "No credentials found for profile anthropic"**

    Điều này nghĩa là lượt chạy bị ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không tìm thấy nó trong kho xác thực của mình.

    - **Dùng Claude CLI**
      - Chạy `openclaw models auth login --provider anthropic --method cli --set-default` trên máy chủ gateway.
    - **Nếu bạn muốn dùng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ gateway**.
      - Xóa mọi thứ tự đã ghim đang buộc dùng một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ gateway**
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy gateway, không phải máy tính xách tay của bạn.

  </Accordion>

  <Accordion title="Tại sao nó cũng thử Google Gemini rồi thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm dự phòng (hoặc bạn đã chuyển sang một dạng viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Cách khắc phục: cung cấp xác thực Google, hoặc gỡ bỏ/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / bí danh để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: cần chữ ký thinking (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **các khối thinking không có chữ ký** (thường từ
    một luồng bị hủy/chưa hoàn tất). Google Antigravity yêu cầu chữ ký cho các khối thinking.

    Cách khắc phục: OpenClaw hiện loại bỏ các khối thinking chưa ký cho Google Antigravity Claude. Nếu vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho agent đó.

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

  <Accordion title="ID hồ sơ điển hình là gì?">
    OpenClaw dùng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có danh tính email)
    - `anthropic:<email>` cho danh tính OAuth
    - ID tùy chỉnh do bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ metadata tùy chọn cho hồ sơ và thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Điều này **không** lưu bí mật; nó ánh xạ ID sang nhà cung cấp/chế độ và đặt thứ tự xoay vòng.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu nó đang trong **thời gian chờ** ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra điều này, hãy chạy `openclaw models status --json` và kiểm tra `auth.unusableProfiles`. Tinh chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian chờ do giới hạn tốc độ có thể áp dụng theo phạm vi mô hình. Một hồ sơ đang trong thời gian chờ
    cho một mô hình vẫn có thể dùng được cho mô hình cùng nhóm trên cùng nhà cung cấp,
    trong khi các cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

    Bạn cũng có thể đặt ghi đè thứ tự **theo từng agent** (được lưu trong `auth-state.json` của agent đó) qua CLI:

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

    Để xác minh thực tế những gì sẽ được thử, hãy dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ khỏi thứ tự rõ ràng, probe sẽ báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth và khóa API - khác nhau ở điểm nào?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập theo gói đăng ký (khi áp dụng).
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [FAQ](/vi/help/faq) — FAQ chính
- [FAQ — bắt đầu nhanh và thiết lập lần chạy đầu tiên](/vi/help/faq-first-run)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Dự phòng mô hình](/vi/concepts/model-failover)
