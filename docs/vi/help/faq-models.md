---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều thất bại"
    - Tìm hiểu hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: mặc định mô hình, lựa chọn, bí danh, chuyển đổi, failover và hồ sơ xác thực'
title: 'FAQ: mô hình và xác thực'
x-i18n:
    generated_at: "2026-06-28T20:43:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  Hỏi đáp về mô hình và hồ sơ xác thực. Về thiết lập, phiên, Gateway, kênh và
  khắc phục sự cố, hãy xem [FAQ](/vi/help/faq) chính.

  ## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

  <AccordionGroup>
  <Accordion title='Mô hình "mặc định" là gì?'>
    Mô hình mặc định của OpenClaw là bất cứ mô hình nào bạn đặt tại:

    ```
    agents.defaults.model.primary
    ```

    Mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `anthropic/claude-sonnet-4-6`). Nếu bạn bỏ qua nhà cung cấp, OpenClaw trước tiên thử một bí danh, sau đó thử một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình như một đường dẫn tương thích đã lỗi thời. Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một mặc định nhà cung cấp đã bị xóa và không còn hợp lệ. Bạn vẫn nên đặt `provider/model` một cách **tường minh**.

  </Accordion>

  <Accordion title="Bạn khuyến nghị mô hình nào?">
    **Mặc định khuyến nghị:** dùng mô hình thế hệ mới nhất mạnh nhất có trong ngăn xếp nhà cung cấp của bạn.
    **Với tác tử có bật công cụ hoặc nhận đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Với trò chuyện thường lệ/rủi ro thấp:** dùng mô hình dự phòng rẻ hơn và định tuyến theo vai trò tác tử.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Mô hình cục bộ](/vi/gateway/local-models).

    Quy tắc kinh nghiệm: dùng **mô hình tốt nhất bạn có thể chi trả** cho công việc rủi ro cao, và một mô hình rẻ hơn
    cho trò chuyện thường lệ hoặc tóm tắt. Bạn có thể định tuyến mô hình theo từng tác tử và dùng tác tử phụ để
    song song hóa các tác vụ dài (mỗi tác tử phụ tiêu thụ token). Xem [Mô hình](/vi/concepts/models) và
    [Tác tử phụ](/vi/tools/subagents).

    Cảnh báo mạnh: các mô hình yếu hơn/bị lượng tử hóa quá mức dễ bị prompt
    injection và hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Bối cảnh thêm: [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình mà không xóa sạch cấu hình?">
    Dùng **lệnh mô hình** hoặc chỉ chỉnh sửa các trường **model**. Tránh thay thế toàn bộ cấu hình.

    Các tùy chọn an toàn:

    - `/model` trong trò chuyện (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn có ý định thay thế toàn bộ cấu hình.
    Với chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup` và ưu tiên `config.patch`. Payload tra cứu cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông và tóm tắt con trực tiếp.
    cho các cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Config](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình tự lưu trữ (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là đường dẫn dễ nhất cho mô hình cục bộ.

    Cách thiết lập nhanh nhất:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ như `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng mô hình đám mây, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cho bạn mô hình đám mây cùng với các mô hình Ollama cục bộ của bạn
    - các mô hình đám mây như `kimi-k2.5:cloud` không cần kéo về cục bộ
    - để chuyển đổi thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc bị lượng tử hóa nặng dễ bị prompt
    injection hơn. Chúng tôi khuyến nghị mạnh mẽ dùng **mô hình lớn** cho bất kỳ bot nào có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng mô hình nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill dùng mô hình nào?">
    - Các triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị nhà cung cấp cố định.
    - Kiểm tra cài đặt runtime hiện tại trên từng Gateway bằng `openclaw models status`.
    - Với các tác tử nhạy cảm về bảo mật/có bật công cụ, hãy dùng mô hình thế hệ mới nhất mạnh nhất hiện có.

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình tức thì (không cần khởi động lại)?">
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

    Bạn có thể liệt kê các mô hình khả dụng bằng `/model`, `/model list`, hoặc `/model status`.

    `/model` (và `/model list`) hiển thị một bộ chọn nhỏ gọn, đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể buộc một hồ sơ xác thực cụ thể cho nhà cung cấp (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị tác tử nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng, và hồ sơ xác thực nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

    **Làm thế nào để bỏ ghim một hồ sơ tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay về mặc định, hãy chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận hồ sơ xác thực nào đang hoạt động.

  </Accordion>

  <Accordion title="Nếu hai nhà cung cấp cung cấp cùng một id mô hình, /model dùng nhà cung cấp nào?">
    `/model provider/model` chọn đúng tuyến nhà cung cấp đó cho phiên.

    Ví dụ, `qianfan/deepseek-v4-flash` và `deepseek/deepseek-v4-flash` là các tham chiếu mô hình khác nhau dù cả hai đều chứa `deepseek-v4-flash`. OpenClaw không nên âm thầm chuyển từ nhà cung cấp này sang nhà cung cấp kia chỉ vì id mô hình trần khớp.

    Một tham chiếu `/model` do người dùng chọn cũng nghiêm ngặt đối với chính sách dự phòng. Nếu nhà cung cấp/mô hình đã chọn đó không khả dụng, phản hồi sẽ thất bại rõ ràng thay vì trả lời từ `agents.defaults.model.fallbacks`. Các chuỗi dự phòng đã cấu hình vẫn áp dụng cho mặc định đã cấu hình, mô hình chính của Cron job và trạng thái dự phòng được tự động chọn.

    Nếu một lượt chạy bắt đầu từ một ghi đè không theo phiên được phép dùng dự phòng, OpenClaw thử nhà cung cấp/mô hình được yêu cầu trước, sau đó đến các dự phòng đã cấu hình, và chỉ sau đó mới đến mô hình chính đã cấu hình. Điều đó ngăn các id mô hình trần trùng lặp nhảy thẳng về nhà cung cấp mặc định.

    Xem [Mô hình](/vi/concepts/models) và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 cho lập trình không?">
    Có. Hãy xem lựa chọn mô hình và lựa chọn runtime là hai việc riêng biệt:

    - **Tác tử lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5`. Đăng nhập bằng `openclaw models auth login --provider openai` khi bạn muốn xác thực bằng đăng ký ChatGPT/Codex.
    - **Tác vụ OpenAI API trực tiếp bên ngoài vòng lặp tác tử:** cấu hình `OPENAI_API_KEY` cho hình ảnh, embedding, giọng nói, realtime và các bề mặt OpenAI API không thuộc tác tử khác.
    - **Xác thực khóa API cho tác tử OpenAI:** dùng `/model openai/gpt-5.5` với một hồ sơ khóa API `openai` có thứ tự.
    - **Tác tử phụ:** định tuyến tác vụ lập trình đến một tác tử tập trung vào Codex với mô hình `openai/gpt-5.5` riêng.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để cấu hình chế độ nhanh cho GPT 5.5?">
    Dùng một nút bật/tắt theo phiên hoặc một mặc định cấu hình:

    - **Theo phiên:** gửi `/fast on` khi phiên đang dùng `openai/gpt-5.5`.
    - **Mặc định theo mô hình:** đặt `agents.defaults.models["openai/gpt-5.5"].params.fastMode` thành `true`.
    - **Ngưỡng cắt tự động:** dùng `/fast auto` hoặc `params.fastMode: "auto"` để bắt đầu các lệnh gọi mô hình mới ở chế độ nhanh cho đến ngưỡng cắt tự động, rồi bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục sau đó mà không dùng chế độ nhanh. Ngưỡng cắt mặc định là 60 giây; đặt `params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.

    Ví dụ:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses gốc được hỗ trợ. Ghi đè `/fast` theo phiên thắng mặc định cấu hình. Các lượt app-server Codex chỉ có thể nhận tầng tại lúc bắt đầu lượt, nên `auto` áp dụng ở lượt mô hình tiếp theo do OpenClaw bắt đầu thay vì bên trong một lượt app-server đang chạy sẵn.

    Xem [Suy luận và chế độ nhanh](/vi/tools/thinking) và [Chế độ nhanh OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Vì sao tôi thấy "Model ... is not allowed" rồi không có phản hồi?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và mọi
    ghi đè phiên. Chọn một mô hình không nằm trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lỗi đó được trả về **thay vì** một phản hồi bình thường. Cách sửa: thêm đúng mô hình vào
    `agents.defaults.models`, thêm ký tự đại diện nhà cung cấp như `"provider/*": {}` cho danh mục nhà cung cấp động, xóa danh sách cho phép, hoặc chọn một mô hình từ `/model list`.
    Nếu lệnh cũng bao gồm `--runtime codex`, hãy cập nhật danh sách cho phép trước rồi thử lại
    cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Vì sao tôi thấy "Unknown model: minimax/MiniMax-M3"?'>
    Điều này nghĩa là **nhà cung cấp chưa được cấu hình** (không tìm thấy cấu hình nhà cung cấp MiniMax hoặc hồ sơ xác thực
    nào), nên không thể phân giải mô hình.

    Danh sách kiểm tra để sửa:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ source `main`), rồi khởi động lại Gateway.
    2. Đảm bảo MiniMax đã được cấu hình (trình hướng dẫn hoặc JSON), hoặc xác thực MiniMax
       tồn tại trong env/hồ sơ xác thực để nhà cung cấp khớp có thể được đưa vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc OAuth MiniMax đã lưu
       cho `minimax-portal`).
    3. Dùng đúng id mô hình (phân biệt chữ hoa/thường) cho đường dẫn xác thực của bạn:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, hoặc
       `minimax/MiniMax-M2.7-highspeed` cho thiết lập khóa API, hoặc
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, hoặc
       `minimax-portal/MiniMax-M2.7-highspeed` cho thiết lập OAuth.
    4. Chạy:

       ```bash
       openclaw models list
       ```

       và chọn từ danh sách (hoặc `/model list` trong trò chuyện).

    Xem [MiniMax](/vi/providers/minimax) và [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Tôi có thể dùng MiniMax làm mặc định và OpenAI cho tác vụ phức tạp không?">
    Có. Dùng **MiniMax làm mặc định** và chuyển mô hình **theo từng phiên** khi cần.
    Dự phòng dành cho **lỗi**, không phải "tác vụ khó", nên hãy dùng `/model` hoặc một tác tử riêng.

    **Tùy chọn A: chuyển theo phiên**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa tác nhân](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải là lối tắt tích hợp sẵn không?">
    Có. OpenClaw cung cấp một vài dạng viết tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    Nếu bạn đặt bí danh riêng có cùng tên, giá trị của bạn sẽ được ưu tiên.

  </Accordion>

  <Accordion title="Làm cách nào để định nghĩa/ghi đè lối tắt mô hình (bí danh)?">
    Bí danh đến từ `agents.defaults.models.<modelId>.alias`. Ví dụ:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) sẽ phân giải tới ID mô hình đó.

  </Accordion>

  <Accordion title="Làm cách nào để thêm mô hình từ nhà cung cấp khác như OpenRouter hoặc Z.AI?">
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

    Nếu bạn tham chiếu một nhà cung cấp/mô hình nhưng thiếu khóa nhà cung cấp bắt buộc, bạn sẽ gặp lỗi xác thực khi chạy (ví dụ `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm tác nhân mới**

    Điều này thường có nghĩa là **tác nhân mới** có kho xác thực trống. Xác thực là theo từng tác nhân và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các cách khắc phục:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của tác nhân chính sang kho xác thực của tác nhân mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ tác nhân mới khi tác nhân đó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên tới tác nhân mặc định/chính mà không cần sao chép refresh token.

    **Không** tái sử dụng `agentDir` giữa các tác nhân; việc đó gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Chuyển dự phòng hoạt động như thế nào?">
    Chuyển dự phòng diễn ra theo hai giai đoạn:

    1. **Luân phiên hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ áp dụng cho các hồ sơ thất bại (backoff theo cấp số nhân), để OpenClaw vẫn có thể phản hồi ngay cả khi nhà cung cấp bị giới hạn tốc độ hoặc tạm thời lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều hơn các phản hồi `429` thông thường. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là các giới hạn tốc độ
    đáng để chuyển dự phòng.

    Một số phản hồi trông giống lỗi thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ lỗi đó
    trong luồng thanh toán, nhưng các bộ khớp văn bản riêng theo nhà cung cấp vẫn chỉ nằm trong phạm vi
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải vô hiệu hóa thanh toán dài hạn.

    Lỗi tràn ngữ cảnh thì khác: các dấu hiệu như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` vẫn đi theo đường dẫn Compaction/thử lại thay vì chuyển sang
    dự phòng mô hình.

    Văn bản lỗi máy chủ chung được cố ý thu hẹp hơn so với "bất cứ thứ gì có
    unknown/error trong đó". OpenClaw có xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic chỉ trả `An unknown error occurred`, OpenRouter chỉ trả
    `Provider returned error`, lỗi lý do dừng như `Unhandled stop reason:
    error`, tải JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và lỗi nhà cung cấp bận như `ModelNotReadyException` là
    tín hiệu hết thời gian/quá tải đáng để chuyển dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn được xử lý thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" nghĩa là gì?'>
    Điều đó có nghĩa là hệ thống đã cố dùng ID hồ sơ xác thực `anthropic:default`, nhưng không tìm thấy thông tin xác thực cho hồ sơ đó trong kho xác thực dự kiến.

    **Danh sách kiểm tra khắc phục:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới so với cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, Gateway có thể không kế thừa biến đó. Đặt nó trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh đúng tác nhân**
      - Thiết lập đa tác nhân nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và nhà cung cấp đã được xác thực hay chưa.

    **Danh sách kiểm tra khắc phục cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là lượt chạy bị ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không tìm thấy hồ sơ đó trong kho xác thực của nó.

    - **Dùng Claude CLI**
      - Chạy `openclaw models auth login --provider anthropic --method cli --set-default` trên máy chủ gateway.
    - **Nếu bạn muốn dùng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ gateway**.
      - Xóa mọi thứ tự đã ghim đang ép dùng một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ gateway**
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy gateway, không phải laptop của bạn.

  </Accordion>

  <Accordion title="Tại sao hệ thống cũng thử Google Gemini và thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm dự phòng (hoặc bạn chuyển sang dạng viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Cách khắc phục: cung cấp xác thực Google, hoặc xóa/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / bí danh để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: cần chữ ký thinking (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **các khối thinking không có chữ ký** (thường từ
    một luồng bị hủy/không hoàn chỉnh). Google Antigravity yêu cầu chữ ký cho các khối thinking.

    Cách khắc phục: OpenClaw hiện loại bỏ các khối thinking chưa ký cho Google Antigravity Claude. Nếu lỗi vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho tác nhân đó.

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

    Để kiểm tra các hồ sơ đã lưu mà không in ra bí mật, chạy `openclaw models auth list` (tùy chọn `--provider <id>` hoặc `--json`). Xem [CLI mô hình](/vi/cli/models#auth-profiles) để biết chi tiết.

  </Accordion>

  <Accordion title="ID hồ sơ thường gặp là gì?">
    OpenClaw dùng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có định danh email)
    - `anthropic:<email>` cho định danh OAuth
    - ID tùy chỉnh do bạn chọn (ví dụ `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ metadata tùy chọn cho hồ sơ và thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Phần này **không** lưu bí mật; nó ánh xạ ID tới nhà cung cấp/chế độ và đặt thứ tự luân phiên.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu hồ sơ đó đang trong **thời gian chờ** ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc trạng thái **bị vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra, chạy `openclaw models status --json` và xem `auth.unusableProfiles`. Điều chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian chờ do giới hạn tốc độ có thể theo phạm vi mô hình. Một hồ sơ đang trong thời gian chờ
    cho một mô hình vẫn có thể dùng được cho một mô hình cùng cấp trên cùng nhà cung cấp,
    trong khi cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

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

    Để xác minh thực tế sẽ thử những gì, dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ khỏi thứ tự rõ ràng, probe báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth so với khóa API - khác nhau ở điểm nào?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth / đăng nhập CLI** thường tận dụng quyền truy cập gói đăng ký khi
      nhà cung cấp hỗ trợ. Với Anthropic, backend Claude CLI của OpenClaw dùng
      Claude Code `claude -p`; Anthropic hiện xem đó là mức sử dụng Agent
      SDK/lập trình. Anthropic đã tạm dừng thay đổi tín dụng Agent
      SDK riêng vào ngày 15 tháng 6 năm 2026, nên hiện tại phần này vẫn tính vào giới hạn
      sử dụng gói đăng ký. Xem [bài viết về gói Agent SDK của
      Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      để biết thông báo tạm dừng hiện tại.
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Câu hỏi thường gặp](/vi/help/faq) — Câu hỏi thường gặp chính
- [Câu hỏi thường gặp — khởi động nhanh và thiết lập lần chạy đầu tiên](/vi/help/faq-first-run)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
