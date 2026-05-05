---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều không thành công"
    - Hiểu về hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: giá trị mặc định của mô hình, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-05-05T01:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  Câu hỏi thường gặp về mô hình và hồ sơ xác thực. Để biết cách thiết lập, phiên, gateway, kênh và
  khắc phục sự cố, hãy xem [FAQ](/vi/help/faq) chính.

  ## Mô hình: mặc định, lựa chọn, alias, chuyển đổi

  <AccordionGroup>
  <Accordion title='“mô hình mặc định” là gì?'>
    Mô hình mặc định của OpenClaw là bất cứ giá trị nào bạn đặt tại:

    ```
    agents.defaults.model.primary
    ```

    Mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5`). Nếu bạn bỏ qua provider, OpenClaw trước tiên sẽ thử một alias, sau đó là một kết quả khớp provider đã cấu hình duy nhất cho đúng model id đó, và chỉ sau đó mới dùng provider mặc định đã cấu hình làm đường tương thích đã lỗi thời. Nếu provider đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ chuyển sang provider/mô hình đã cấu hình đầu tiên thay vì hiển thị một mặc định provider cũ đã bị loại bỏ. Bạn vẫn nên đặt `provider/model` **một cách rõ ràng**.

  </Accordion>

  <Accordion title="Bạn khuyến nghị mô hình nào?">
    **Mặc định khuyến nghị:** dùng mô hình thế hệ mới nhất mạnh nhất có sẵn trong bộ provider của bạn.
    **Với agent có bật công cụ hoặc nhận đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Với trò chuyện thường nhật/rủi ro thấp:** dùng các mô hình dự phòng rẻ hơn và định tuyến theo vai trò agent.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Mô hình cục bộ](/vi/gateway/local-models).

    Quy tắc kinh nghiệm: dùng **mô hình tốt nhất bạn có thể chi trả** cho công việc rủi ro cao, và một mô hình rẻ hơn
    cho trò chuyện thường nhật hoặc tóm tắt. Bạn có thể định tuyến mô hình theo từng agent và dùng sub-agent để
    song song hóa các tác vụ dài (mỗi sub-agent tiêu thụ token). Xem [Mô hình](/vi/concepts/models) và
    [Sub-agent](/vi/tools/subagents).

    Cảnh báo nghiêm túc: các mô hình yếu hơn/bị lượng tử hóa quá mức dễ bị prompt
    injection và hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Ngữ cảnh bổ sung: [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình mà không xóa cấu hình?">
    Dùng **lệnh mô hình** hoặc chỉ chỉnh sửa các trường **model**. Tránh thay thế toàn bộ cấu hình.

    Các lựa chọn an toàn:

    - `/model` trong chat (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn có ý định thay thế toàn bộ cấu hình.
    Với chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup` và ưu tiên `config.patch`. Payload tra cứu cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông, và tóm tắt các con trực tiếp.
    cho các cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Cấu hình](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình tự host (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là cách dễ nhất cho mô hình cục bộ.

    Thiết lập nhanh nhất:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Tải một mô hình cục bộ như `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng mô hình cloud, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn mô hình cloud cùng các mô hình Ollama cục bộ
    - các mô hình cloud như `kimi-k2.5:cloud` không cần tải cục bộ
    - để chuyển thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc bị lượng tử hóa mạnh dễ bị prompt
    injection hơn. Chúng tôi khuyến nghị mạnh mẽ dùng **mô hình lớn** cho mọi bot có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng mô hình nhỏ, hãy bật sandboxing và allowlist công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Provider mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill dùng mô hình nào?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị provider cố định.
    - Kiểm tra thiết lập runtime hiện tại trên từng gateway bằng `openclaw models status`.
    - Với agent nhạy cảm về bảo mật/có bật công cụ, hãy dùng mô hình thế hệ mới nhất mạnh nhất có sẵn.

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình ngay lập tức (không cần khởi động lại)?">
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

    Đây là các alias tích hợp sẵn. Có thể thêm alias tùy chỉnh qua `agents.defaults.models`.

    Bạn có thể liệt kê các mô hình có sẵn bằng `/model`, `/model list`, hoặc `/model status`.

    `/model` (và `/model list`) hiển thị bộ chọn ngắn gọn, có đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể ép một hồ sơ xác thực cụ thể cho provider (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị agent nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng, và hồ sơ xác thực nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint provider đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

    **Làm thế nào để bỏ ghim một hồ sơ tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không kèm** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay lại mặc định, hãy chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận hồ sơ xác thực nào đang hoạt động.

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 cho lập trình không?">
    Có. Hãy xử lý lựa chọn mô hình và lựa chọn runtime riêng biệt:

    - **Agent lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5` và `agents.defaults.agentRuntime.id` thành `"codex"`. Đăng nhập bằng `openclaw models auth login --provider openai-codex` khi bạn muốn xác thực bằng gói đăng ký ChatGPT/Codex.
    - **Tác vụ OpenAI API trực tiếp qua PI:** dùng `/model openai/gpt-5.5` mà không ghi đè runtime Codex và cấu hình `OPENAI_API_KEY`.
    - **Codex OAuth qua PI:** chỉ dùng `/model openai-codex/gpt-5.5` khi bạn cố ý muốn runner PI bình thường với Codex OAuth.
    - **Sub-agent:** định tuyến tác vụ lập trình tới một agent chỉ dùng Codex với mô hình riêng và mặc định `agentRuntime`.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để cấu hình chế độ nhanh cho GPT 5.5?">
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

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses gốc được hỗ trợ. `/fast` theo phiên sẽ ghi đè mặc định cấu hình.

    Xem [Thinking và chế độ nhanh](/vi/tools/thinking) và [Chế độ nhanh của OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Model ... is not allowed" rồi không có phản hồi?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **allowlist** cho `/model` và mọi
    ghi đè phiên. Chọn một mô hình không có trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lỗi đó được trả về **thay vì** phản hồi bình thường. Cách sửa: thêm mô hình vào
    `agents.defaults.models`, xóa allowlist, hoặc chọn một mô hình từ `/model list`.
    Nếu lệnh cũng bao gồm `--runtime codex`, hãy thêm mô hình trước rồi thử lại
    cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này có nghĩa là **provider chưa được cấu hình** (không tìm thấy cấu hình provider MiniMax hoặc hồ sơ xác thực),
    nên không thể phân giải mô hình.

    Danh sách kiểm tra để sửa:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ source `main`), rồi khởi động lại gateway.
    2. Đảm bảo MiniMax đã được cấu hình (wizard hoặc JSON), hoặc xác thực MiniMax
       tồn tại trong env/hồ sơ xác thực để provider khớp có thể được tiêm vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc MiniMax
       OAuth đã lưu cho `minimax-portal`).
    3. Dùng đúng model id chính xác (phân biệt chữ hoa/chữ thường) cho đường xác thực của bạn:
       `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed` cho thiết lập
       API key, hoặc `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` cho thiết lập OAuth.
    4. Chạy:

       ```bash
       openclaw models list
       ```

       và chọn từ danh sách (hoặc `/model list` trong chat).

    Xem [MiniMax](/vi/providers/minimax) và [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể dùng MiniMax làm mặc định và OpenAI cho tác vụ phức tạp không?">
    Có. Dùng **MiniMax làm mặc định** và chuyển mô hình **theo từng phiên** khi cần.
    Fallback dành cho **lỗi**, không phải "tác vụ khó", vì vậy hãy dùng `/model` hoặc một agent riêng.

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

    - Mặc định của Agent A: MiniMax
    - Mặc định của Agent B: OpenAI
    - Định tuyến theo agent hoặc dùng `/agent` để chuyển

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải là lối tắt tích hợp sẵn không?">
    Có. OpenClaw cung cấp một vài lối viết tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` cho thiết lập API key, hoặc `openai-codex/gpt-5.5` khi được cấu hình cho Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt alias riêng cùng tên, giá trị của bạn sẽ được ưu tiên.

  </Accordion>

  <Accordion title="Làm thế nào để định nghĩa/ghi đè lối tắt mô hình (alias)?">
    Alias đến từ `agents.defaults.models.<modelId>.alias`. Ví dụ:

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

  <Accordion title="Làm thế nào để thêm mô hình từ các provider khác như OpenRouter hoặc Z.AI?">
    OpenRouter (trả theo token; nhiều mô hình):

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

    Z.AI (các mô hình GLM):

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

    Nếu bạn tham chiếu một nhà cung cấp/mô hình nhưng thiếu khóa nhà cung cấp bắt buộc, bạn sẽ gặp lỗi xác thực lúc chạy (ví dụ: `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm agent mới**

    Điều này thường có nghĩa là **agent mới** có kho xác thực trống. Xác thực là theo từng agent và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các cách khắc phục:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của agent chính vào kho xác thực của agent mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ agent mới khi agent đó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên tới agent mặc định/chính mà không cần sao chép token làm mới.

    **Không** dùng lại `agentDir` giữa các agent; việc này gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển đổi dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="How does failover work?">
    Chuyển đổi dự phòng diễn ra theo hai giai đoạn:

    1. **Luân phiên hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ áp dụng cho các hồ sơ gặp lỗi (backoff lũy thừa), nên OpenClaw có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều trường hợp hơn các phản hồi `429` đơn thuần. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là giới hạn tốc độ
    đáng để chuyển đổi dự phòng.

    Một số phản hồi trông như lỗi thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu một nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ điều đó trong
    luồng thanh toán, nhưng các bộ khớp văn bản theo từng nhà cung cấp vẫn chỉ nằm trong phạm vi
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu của tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải vô hiệu hóa thanh toán dài hạn.

    Lỗi tràn ngữ cảnh thì khác: các dấu hiệu như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` vẫn đi theo đường Compaction/thử lại thay vì chuyển sang
    dự phòng mô hình.

    Văn bản lỗi máy chủ chung được cố ý thu hẹp hơn so với "bất kỳ thứ gì có
    unknown/error trong đó". OpenClaw có xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic chỉ trả về `An unknown error occurred`, OpenRouter chỉ trả về
    `Provider returned error`, lỗi lý do dừng như `Unhandled stop reason:
    error`, payload JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và lỗi nhà cung cấp bận như `ModelNotReadyException` là
    tín hiệu hết thời gian/quá tải đáng để chuyển đổi dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn được xử lý thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    Điều đó có nghĩa là hệ thống đã cố dùng ID hồ sơ xác thực `anthropic:default`, nhưng không tìm thấy thông tin xác thực cho hồ sơ đó trong kho xác thực dự kiến.

    **Danh sách kiểm tra khắc phục:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới so với kế thừa)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Kế thừa: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, Gateway có thể không kế thừa biến đó. Hãy đặt biến trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh sửa đúng agent**
      - Thiết lập nhiều agent nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và nhà cung cấp đã được xác thực hay chưa.

    **Danh sách kiểm tra khắc phục cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là lượt chạy được ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không tìm thấy hồ sơ đó trong kho xác thực của nó.

    - **Dùng Claude CLI**
      - Chạy `openclaw models auth login --provider anthropic --method cli --set-default` trên máy chủ Gateway.
    - **Nếu bạn muốn dùng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ Gateway**.
      - Xóa mọi thứ tự đã ghim buộc dùng một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ Gateway**
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy Gateway, không phải máy tính xách tay của bạn.

  </Accordion>

  <Accordion title="Why did it also try Google Gemini and fail?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm phương án dự phòng (hoặc bạn đã chuyển sang một cách viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Khắc phục: hoặc cung cấp xác thực Google, hoặc xóa/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / alias để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: bắt buộc có chữ ký thinking (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **các khối thinking không có chữ ký** (thường từ
    một luồng bị hủy/dở dang). Google Antigravity yêu cầu chữ ký cho các khối thinking.

    Khắc phục: OpenClaw hiện loại bỏ các khối thinking chưa ký cho Google Antigravity Claude. Nếu lỗi vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho agent đó.

  </Accordion>
</AccordionGroup>

## Hồ sơ xác thực: chúng là gì và cách quản lý

Liên quan: [/concepts/oauth](/vi/concepts/oauth) (luồng OAuth, lưu trữ token, mẫu nhiều tài khoản)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    Hồ sơ xác thực là một bản ghi thông tin xác thực có tên (OAuth hoặc khóa API) gắn với một nhà cung cấp. Hồ sơ nằm trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Để kiểm tra các hồ sơ đã lưu mà không in ra bí mật, hãy chạy `openclaw models auth list` (tùy chọn `--provider <id>` hoặc `--json`). Xem [Models CLI](/vi/cli/models#openclaw-models-auth-list) để biết chi tiết.

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw dùng ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có định danh email)
    - `anthropic:<email>` cho định danh OAuth
    - ID tùy chỉnh bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    Có. Cấu hình hỗ trợ siêu dữ liệu tùy chọn cho hồ sơ và thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Điều này **không** lưu bí mật; nó ánh xạ ID tới nhà cung cấp/chế độ và đặt thứ tự luân phiên.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu hồ sơ đó đang trong **thời gian chờ** ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra điều này, chạy `openclaw models status --json` và xem `auth.unusableProfiles`. Tinh chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian chờ do giới hạn tốc độ có thể được giới hạn theo mô hình. Một hồ sơ đang trong thời gian chờ
    cho một mô hình vẫn có thể dùng được cho một mô hình cùng nhóm trên cùng nhà cung cấp,
    trong khi các cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

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

    Để xác minh những gì thực sự sẽ được thử, dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ khỏi thứ tự rõ ràng, probe báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập thuê bao (khi áp dụng).
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [FAQ](/vi/help/faq) — FAQ chính
- [FAQ — bắt đầu nhanh và thiết lập lần chạy đầu tiên](/vi/help/faq-first-run)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Dự phòng mô hình](/vi/concepts/model-failover)
