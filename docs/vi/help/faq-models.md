---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều không thành công"
    - Tìm hiểu về hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: mặc định của mô hình, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-04-29T22:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Câu hỏi thường gặp về mô hình và hồ sơ xác thực. Để biết cách thiết lập, phiên, Gateway, kênh và
  khắc phục sự cố, hãy xem [FAQ](/vi/help/faq) chính.

  ## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

  <AccordionGroup>
  <Accordion title='“Mô hình mặc định” là gì?'>
    Mô hình mặc định của OpenClaw là bất cứ mô hình nào bạn đặt là:

    ```
    agents.defaults.model.primary
    ```

    Mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5`). Nếu bạn bỏ qua nhà cung cấp, OpenClaw trước tiên sẽ thử một bí danh, sau đó thử một kết quả khớp duy nhất với nhà cung cấp đã cấu hình cho đúng id mô hình đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình như một đường dẫn tương thích cũ không còn khuyến nghị. Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một mặc định cũ của nhà cung cấp đã bị gỡ bỏ. Bạn vẫn nên đặt `provider/model` **một cách tường minh**.

  </Accordion>

  <Accordion title="Bạn khuyến nghị mô hình nào?">
    **Mặc định khuyến nghị:** dùng mô hình thế hệ mới nhất mạnh nhất có sẵn trong ngăn xếp nhà cung cấp của bạn.
    **Với tác tử có bật công cụ hoặc đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Với trò chuyện thường lệ/rủi ro thấp:** dùng các mô hình dự phòng rẻ hơn và định tuyến theo vai trò tác tử.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Mô hình cục bộ](/vi/gateway/local-models).

    Quy tắc kinh nghiệm: dùng **mô hình tốt nhất bạn có thể chi trả** cho công việc quan trọng, và mô hình rẻ hơn
    cho trò chuyện hoặc tóm tắt thường lệ. Bạn có thể định tuyến mô hình theo từng tác tử và dùng tác tử con để
    song song hóa các tác vụ dài (mỗi tác tử con tiêu thụ token). Xem [Mô hình](/vi/concepts/models) và
    [Tác tử con](/vi/tools/subagents).

    Cảnh báo mạnh: các mô hình yếu hơn/bị lượng tử hóa quá mức dễ bị tấn công chèn prompt
    và có hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Ngữ cảnh thêm: [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Làm sao để chuyển mô hình mà không xóa sạch cấu hình?">
    Dùng **lệnh mô hình** hoặc chỉ chỉnh sửa các trường **model**. Tránh thay thế toàn bộ cấu hình.

    Các tùy chọn an toàn:

    - `/model` trong chat (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn có ý định thay thế toàn bộ cấu hình.
    Với chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup` và ưu tiên `config.patch`. Payload tra cứu cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông, và tóm tắt con trực tiếp.
    cho các cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Cấu hình](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình tự host (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là cách dễ nhất cho các mô hình cục bộ.

    Thiết lập nhanh nhất:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ như `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng mô hình đám mây, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn mô hình đám mây cùng với các mô hình Ollama cục bộ của bạn
    - các mô hình đám mây như `kimi-k2.5:cloud` không cần kéo về cục bộ
    - để chuyển thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc bị lượng tử hóa mạnh dễ bị tấn công chèn prompt
    hơn. Chúng tôi khuyến nghị mạnh mẽ dùng **mô hình lớn** cho mọi bot có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng mô hình nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill dùng mô hình nào?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị nhà cung cấp cố định.
    - Kiểm tra thiết lập runtime hiện tại trên từng gateway bằng `openclaw models status`.
    - Với các tác tử nhạy cảm về bảo mật/có bật công cụ, hãy dùng mô hình thế hệ mới nhất mạnh nhất có sẵn.

  </Accordion>

  <Accordion title="Làm sao để chuyển mô hình tức thì (không cần khởi động lại)?">
    Dùng lệnh `/model` dưới dạng một tin nhắn độc lập:

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

    `/model` (và `/model list`) hiển thị một bộ chọn nhỏ gọn, đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể ép dùng một hồ sơ xác thực cụ thể cho nhà cung cấp (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị tác tử nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng, và hồ sơ xác thực nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

    **Làm sao để bỏ ghim hồ sơ tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay lại mặc định, hãy chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận hồ sơ xác thực nào đang hoạt động.

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 cho lập trình không?">
    Có. Đặt một mô hình làm mặc định và chuyển khi cần:

    - **Chuyển nhanh (theo từng phiên):** `/model openai/gpt-5.5` cho các tác vụ khóa API OpenAI trực tiếp hiện tại hoặc `/model openai-codex/gpt-5.5` cho các tác vụ OAuth GPT-5.5 Codex.
    - **Mặc định:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5` cho cách dùng khóa API hoặc `openai-codex/gpt-5.5` cho cách dùng OAuth GPT-5.5 Codex.
    - **Tác tử con:** định tuyến tác vụ lập trình tới tác tử con với một mô hình mặc định khác.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm sao để cấu hình chế độ nhanh cho GPT 5.5?">
    Dùng công tắc phiên hoặc mặc định cấu hình:

    - **Theo từng phiên:** gửi `/fast on` khi phiên đang dùng `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5`.
    - **Mặc định theo mô hình:** đặt `agents.defaults.models["openai/gpt-5.5"].params.fastMode` hoặc `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` thành `true`.

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

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses native được hỗ trợ. Ghi đè `/fast` theo phiên sẽ thắng các mặc định cấu hình.

    Xem [Thinking và chế độ nhanh](/vi/tools/thinking) và [Chế độ nhanh OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Vì sao tôi thấy "Model ... is not allowed" rồi không có phản hồi?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và mọi
    ghi đè phiên. Chọn một mô hình không nằm trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Lỗi đó được trả về **thay cho** phản hồi bình thường. Cách sửa: thêm mô hình vào
    `agents.defaults.models`, xóa danh sách cho phép, hoặc chọn một mô hình từ `/model list`.

  </Accordion>

  <Accordion title='Vì sao tôi thấy "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này nghĩa là **nhà cung cấp chưa được cấu hình** (không tìm thấy cấu hình nhà cung cấp MiniMax hoặc hồ sơ xác thực),
    nên không thể phân giải mô hình.

    Danh sách kiểm tra cách sửa:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ source `main`), rồi khởi động lại gateway.
    2. Đảm bảo MiniMax đã được cấu hình (trình hướng dẫn hoặc JSON), hoặc xác thực MiniMax
       tồn tại trong env/hồ sơ xác thực để nhà cung cấp khớp có thể được chèn vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc MiniMax
       OAuth đã lưu cho `minimax-portal`).
    3. Dùng đúng id mô hình chính xác (phân biệt chữ hoa/thường) cho đường dẫn xác thực của bạn:
       `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed` cho thiết lập
       khóa API, hoặc `minimax-portal/MiniMax-M2.7` /
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
    Dự phòng dành cho **lỗi**, không phải "tác vụ khó", vì vậy hãy dùng `/model` hoặc một tác tử riêng.

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

    **Tùy chọn B: tác tử riêng**

    - Mặc định của tác tử A: MiniMax
    - Mặc định của tác tử B: OpenAI
    - Định tuyến theo tác tử hoặc dùng `/agent` để chuyển

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa tác tử](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải phím tắt tích hợp sẵn không?">
    Có. OpenClaw đi kèm một vài cách viết tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` cho thiết lập khóa API, hoặc `openai-codex/gpt-5.5` khi được cấu hình cho Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt bí danh riêng có cùng tên, giá trị của bạn sẽ thắng.

  </Accordion>

  <Accordion title="Làm sao để định nghĩa/ghi đè phím tắt mô hình (bí danh)?">
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

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) phân giải thành ID mô hình đó.

  </Accordion>

  <Accordion title="Làm sao để thêm mô hình từ nhà cung cấp khác như OpenRouter hoặc Z.AI?">
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

    Nếu bạn tham chiếu một nhà cung cấp/mô hình nhưng thiếu khóa nhà cung cấp bắt buộc, bạn sẽ gặp lỗi xác thực lúc chạy (ví dụ: `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm tác nhân mới**

    Điều này thường có nghĩa là **tác nhân mới** có kho xác thực trống. Xác thực là theo từng tác nhân và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các cách khắc phục:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của tác nhân chính sang kho xác thực của tác nhân mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ tác nhân mới khi nó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên qua tác nhân mặc định/chính mà không cần sao chép refresh token.

    **Không** dùng lại `agentDir` giữa các tác nhân; việc này gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển đổi dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Cơ chế chuyển đổi dự phòng hoạt động như thế nào?">
    Chuyển đổi dự phòng diễn ra trong hai giai đoạn:

    1. **Xoay vòng hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ hồi phục áp dụng cho các hồ sơ bị lỗi (backoff lũy thừa), vì vậy OpenClaw vẫn có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều hơn các phản hồi `429` thông thường. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là các giới hạn tốc độ
    đủ điều kiện để chuyển đổi dự phòng.

    Một số phản hồi trông giống lỗi thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu một nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ phản hồi đó
    trong nhánh thanh toán, nhưng các bộ khớp văn bản theo từng nhà cung cấp vẫn được giới hạn trong
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu của tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải vô hiệu hóa thanh toán dài hạn.

    Lỗi tràn ngữ cảnh thì khác: các dấu hiệu như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` vẫn đi theo đường dẫn nén/thử lại thay vì tiến sang dự phòng mô hình.

    Văn bản lỗi máy chủ chung cố ý hẹp hơn "bất cứ thứ gì có
    unknown/error trong đó". OpenClaw xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic dạng trần `An unknown error occurred`, OpenRouter dạng trần
    `Provider returned error`, lỗi lý do dừng như `Unhandled stop reason:
    error`, payload JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và lỗi nhà cung cấp đang bận như `ModelNotReadyException` là
    tín hiệu hết thời gian/quá tải đủ điều kiện chuyển đổi dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn được xử lý thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” có nghĩa là gì?'>
    Điều đó có nghĩa là hệ thống đã cố dùng ID hồ sơ xác thực `anthropic:default`, nhưng không tìm thấy thông tin xác thực cho nó trong kho xác thực dự kiến.

    **Danh sách kiểm tra khắc phục:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới so với cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, Gateway có thể không kế thừa biến đó. Đặt nó trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh sửa đúng tác nhân**
      - Thiết lập nhiều tác nhân nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và liệu các nhà cung cấp đã được xác thực hay chưa.

    **Danh sách kiểm tra khắc phục cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là lượt chạy được ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
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
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy gateway, không phải máy tính xách tay của bạn.

  </Accordion>

  <Accordion title="Tại sao nó cũng thử Google Gemini và thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm dự phòng (hoặc bạn đã chuyển sang một cách viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Cách khắc phục: cung cấp xác thực Google, hoặc xóa/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / bí danh để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: bắt buộc có chữ ký suy nghĩ (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **khối suy nghĩ không có chữ ký** (thường từ
    một luồng bị hủy/không hoàn chỉnh). Google Antigravity yêu cầu chữ ký cho các khối suy nghĩ.

    Cách khắc phục: OpenClaw hiện loại bỏ các khối suy nghĩ chưa ký cho Google Antigravity Claude. Nếu lỗi vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho tác nhân đó.

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

  </Accordion>

  <Accordion title="ID hồ sơ điển hình là gì?">
    OpenClaw dùng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có danh tính email)
    - `anthropic:<email>` cho danh tính OAuth
    - ID tùy chỉnh bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ siêu dữ liệu tùy chọn cho hồ sơ và thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Việc này **không** lưu bí mật; nó ánh xạ ID tới nhà cung cấp/chế độ và đặt thứ tự xoay vòng.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu nó đang trong **thời gian chờ hồi phục** ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra, chạy `openclaw models status --json` và xem `auth.unusableProfiles`. Tinh chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian chờ hồi phục do giới hạn tốc độ có thể theo phạm vi mô hình. Một hồ sơ đang trong thời gian chờ hồi phục
    cho một mô hình vẫn có thể dùng được cho mô hình cùng nhóm trên cùng nhà cung cấp,
    trong khi các cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

    Bạn cũng có thể đặt ghi đè thứ tự **theo từng tác nhân** (lưu trong `auth-state.json` của tác nhân đó) qua CLI:

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

    Để nhắm tới một tác nhân cụ thể:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Để xác minh thực tế sẽ thử gì, dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ khỏi thứ tự rõ ràng, probe báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth so với khóa API - khác nhau thế nào?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập theo gói đăng ký (khi áp dụng được).
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth, và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Câu hỏi thường gặp](/vi/help/faq) — phần Câu hỏi thường gặp chính
- [Câu hỏi thường gặp — bắt đầu nhanh và thiết lập lần chạy đầu tiên](/vi/help/faq-first-run)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
