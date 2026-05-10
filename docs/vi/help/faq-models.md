---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả các mô hình đều thất bại"
    - Tìm hiểu về hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: giá trị mặc định của mô hình, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-05-10T19:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  Hỏi đáp về mô hình và auth-profile. Để thiết lập, phiên, Gateway, kênh và
  khắc phục sự cố, hãy xem [FAQ](/vi/help/faq) chính.

  ## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

  <AccordionGroup>
  <Accordion title='“Mô hình mặc định” là gì?'>
    Mô hình mặc định của OpenClaw là bất cứ giá trị nào bạn đặt tại:

    ```
    agents.defaults.model.primary
    ```

    Mô hình được tham chiếu dưới dạng `provider/model` (ví dụ: `openai/gpt-5.5` hoặc `anthropic/claude-sonnet-4-6`). Nếu bạn bỏ qua nhà cung cấp, trước tiên OpenClaw sẽ thử bí danh, sau đó thử một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình đó, và chỉ sau đó mới quay về nhà cung cấp mặc định đã cấu hình như một đường tương thích đã không còn khuyến nghị. Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một mặc định nhà cung cấp đã bị gỡ bỏ và lỗi thời. Bạn vẫn nên đặt `provider/model` **một cách tường minh**.

  </Accordion>

  <Accordion title="Bạn khuyến nghị mô hình nào?">
    **Mặc định khuyến nghị:** dùng mô hình thế hệ mới nhất mạnh nhất có trong tập nhà cung cấp của bạn.
    **Với agent có bật công cụ hoặc nhận đầu vào không đáng tin cậy:** ưu tiên sức mạnh mô hình hơn chi phí.
    **Với trò chuyện thường lệ/rủi ro thấp:** dùng mô hình dự phòng rẻ hơn và định tuyến theo vai trò agent.

    MiniMax có tài liệu riêng: [MiniMax](/vi/providers/minimax) và
    [Mô hình cục bộ](/vi/gateway/local-models).

    Quy tắc kinh nghiệm: dùng **mô hình tốt nhất bạn có thể chi trả** cho công việc có rủi ro cao, và một mô hình rẻ hơn
    cho trò chuyện thường lệ hoặc tóm tắt. Bạn có thể định tuyến mô hình theo từng agent và dùng sub-agent để
    song song hóa các tác vụ dài (mỗi sub-agent tiêu thụ token). Xem [Mô hình](/vi/concepts/models) và
    [Sub-agent](/vi/tools/subagents).

    Cảnh báo mạnh: các mô hình yếu hơn/bị lượng tử hóa quá mức dễ bị prompt
    injection và hành vi không an toàn hơn. Xem [Bảo mật](/vi/gateway/security).

    Ngữ cảnh thêm: [Mô hình](/vi/concepts/models).

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình mà không xóa sạch cấu hình?">
    Dùng **lệnh mô hình** hoặc chỉ sửa các trường **model**. Tránh thay thế toàn bộ cấu hình.

    Các lựa chọn an toàn:

    - `/model` trong trò chuyện (nhanh, theo từng phiên)
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - sửa `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Tránh dùng `config.apply` với một đối tượng một phần trừ khi bạn có ý định thay thế toàn bộ cấu hình.
    Với chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup` và ưu tiên `config.patch`. Payload tra cứu cung cấp cho bạn đường dẫn đã chuẩn hóa, tài liệu/ràng buộc schema nông và tóm tắt các mục con trực tiếp.
    cho các cập nhật một phần.
    Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy lại `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure), [Config](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng mô hình tự host (llama.cpp, vLLM, Ollama) không?">
    Có. Ollama là đường dễ nhất cho mô hình cục bộ.

    Thiết lập nhanh nhất:

    1. Cài Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ như `ollama pull gemma4`
    3. Nếu bạn cũng muốn dùng mô hình đám mây, chạy `ollama signin`
    4. Chạy `openclaw onboard` và chọn `Ollama`
    5. Chọn `Local` hoặc `Cloud + Local`

    Ghi chú:

    - `Cloud + Local` cung cấp cho bạn mô hình đám mây cùng các mô hình Ollama cục bộ của bạn
    - các mô hình đám mây như `kimi-k2.5:cloud` không cần kéo về cục bộ
    - để chuyển thủ công, dùng `openclaw models list` và `openclaw models set ollama/<model>`

    Ghi chú bảo mật: các mô hình nhỏ hơn hoặc bị lượng tử hóa nặng dễ bị prompt
    injection hơn. Chúng tôi đặc biệt khuyến nghị **mô hình lớn** cho bất kỳ bot nào có thể dùng công cụ.
    Nếu bạn vẫn muốn dùng mô hình nhỏ, hãy bật sandboxing và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandboxing](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd và Krill dùng mô hình nào?">
    - Các bản triển khai này có thể khác nhau và có thể thay đổi theo thời gian; không có khuyến nghị nhà cung cấp cố định.
    - Kiểm tra thiết lập runtime hiện tại trên từng gateway bằng `openclaw models status`.
    - Với các agent nhạy cảm về bảo mật/có bật công cụ, hãy dùng mô hình thế hệ mới nhất mạnh nhất có sẵn.

  </Accordion>

  <Accordion title="Làm thế nào để chuyển mô hình tức thời (không cần khởi động lại)?">
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

    `/model` (và `/model list`) hiển thị một bộ chọn nhỏ gọn, có đánh số. Chọn theo số:

    ```
    /model 3
    ```

    Bạn cũng có thể ép một auth profile cụ thể cho nhà cung cấp (theo từng phiên):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Mẹo: `/model status` hiển thị agent nào đang hoạt động, tệp `auth-profiles.json` nào đang được dùng và auth profile nào sẽ được thử tiếp theo.
    Nó cũng hiển thị endpoint nhà cung cấp đã cấu hình (`baseUrl`) và chế độ API (`api`) khi có.

    **Làm thế nào để bỏ ghim một profile tôi đã đặt bằng @profile?**

    Chạy lại `/model` **không có** hậu tố `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Nếu bạn muốn quay lại mặc định, hãy chọn nó từ `/model` (hoặc gửi `/model <default provider/model>`).
    Dùng `/model status` để xác nhận auth profile nào đang hoạt động.

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 cho lập trình không?">
    Có. Hãy xem lựa chọn mô hình và lựa chọn runtime là hai việc riêng:

    - **Agent lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành `openai/gpt-5.5`. Đăng nhập bằng `openclaw models auth login --provider openai-codex` khi bạn muốn dùng xác thực thuê bao ChatGPT/Codex.
    - **Tác vụ API OpenAI trực tiếp ngoài vòng lặp agent:** cấu hình `OPENAI_API_KEY` cho hình ảnh, embeddings, speech, realtime và các bề mặt API OpenAI không thuộc agent khác.
    - **Xác thực bằng API key cho agent OpenAI:** dùng `/model openai/gpt-5.5` với một profile API-key `openai-codex` có thứ tự.
    - **Sub-agent:** định tuyến tác vụ lập trình đến một agent tập trung vào Codex với mô hình `openai/gpt-5.5` riêng.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh slash](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm thế nào để cấu hình chế độ nhanh cho GPT 5.5?">
    Dùng một công tắc theo phiên hoặc một mặc định cấu hình:

    - **Theo phiên:** gửi `/fast on` khi phiên đang dùng `openai/gpt-5.5`.
    - **Mặc định theo mô hình:** đặt `agents.defaults.models["openai/gpt-5.5"].params.fastMode` thành `true`.

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

    Với OpenAI, chế độ nhanh ánh xạ tới `service_tier = "priority"` trên các yêu cầu Responses gốc được hỗ trợ. Ghi đè `/fast` theo phiên thắng các mặc định cấu hình.

    Xem [Thinking và chế độ nhanh](/vi/tools/thinking) và [Chế độ nhanh OpenAI](/vi/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Model ... is not allowed" rồi không có trả lời?'>
    Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và mọi
    ghi đè theo phiên. Chọn một mô hình không có trong danh sách đó sẽ trả về:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Lỗi đó được trả về **thay vì** một phản hồi bình thường. Cách sửa: thêm đúng mô hình đó vào
    `agents.defaults.models`, thêm wildcard nhà cung cấp như `"provider/*": {}` cho catalog nhà cung cấp động, gỡ danh sách cho phép, hoặc chọn một mô hình từ `/model list`.
    Nếu lệnh cũng bao gồm `--runtime codex`, hãy cập nhật danh sách cho phép trước rồi thử lại
    cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Unknown model: minimax/MiniMax-M2.7"?'>
    Điều này nghĩa là **nhà cung cấp chưa được cấu hình** (không tìm thấy cấu hình nhà cung cấp MiniMax hoặc auth
    profile), nên không thể phân giải mô hình.

    Danh sách kiểm tra cách sửa:

    1. Nâng cấp lên bản phát hành OpenClaw hiện tại (hoặc chạy từ mã nguồn `main`), rồi khởi động lại gateway.
    2. Đảm bảo MiniMax đã được cấu hình (wizard hoặc JSON), hoặc xác thực MiniMax
       tồn tại trong env/auth profile để nhà cung cấp tương ứng có thể được chèn vào
       (`MINIMAX_API_KEY` cho `minimax`, `MINIMAX_OAUTH_TOKEN` hoặc OAuth MiniMax
       đã lưu cho `minimax-portal`).
    3. Dùng đúng id mô hình (phân biệt hoa thường) cho đường xác thực của bạn:
       `minimax/MiniMax-M2.7` hoặc `minimax/MiniMax-M2.7-highspeed` cho thiết lập
       bằng API-key, hoặc `minimax-portal/MiniMax-M2.7` /
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
    Dự phòng là cho **lỗi**, không phải “tác vụ khó”, nên hãy dùng `/model` hoặc một agent riêng.

    **Tùy chọn A: chuyển theo phiên**

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

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa agent](/vi/concepts/multi-agent), [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải là lối tắt tích hợp sẵn không?">
    Có. OpenClaw phát hành kèm một vài cách viết tắt mặc định (chỉ áp dụng khi mô hình tồn tại trong `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Nếu bạn đặt bí danh riêng trùng tên, giá trị của bạn sẽ được ưu tiên.

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

  <Accordion title="Làm thế nào để thêm mô hình từ nhà cung cấp khác như OpenRouter hoặc Z.AI?">
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

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm tác tử mới**

    Điều này thường có nghĩa là **tác tử mới** có kho xác thực trống. Xác thực được áp dụng theo từng tác tử và
    được lưu trong:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Các tùy chọn sửa lỗi:

    - Chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn.
    - Hoặc chỉ sao chép các hồ sơ `api_key` / `token` tĩnh có thể di chuyển từ kho xác thực của tác tử chính sang kho xác thực của tác tử mới.
    - Với hồ sơ OAuth, hãy đăng nhập từ tác tử mới khi tác tử đó cần tài khoản riêng; nếu không, OpenClaw có thể đọc xuyên qua tác tử mặc định/chính mà không cần nhân bản refresh token.

    **Không** dùng lại `agentDir` giữa các tác tử; việc đó gây xung đột xác thực/phiên.

  </Accordion>
</AccordionGroup>

## Chuyển đổi dự phòng mô hình và "All models failed"

<AccordionGroup>
  <Accordion title="Chuyển đổi dự phòng hoạt động như thế nào?">
    Chuyển đổi dự phòng diễn ra theo hai giai đoạn:

    1. **Luân phiên hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian chờ hồi phục được áp dụng cho các hồ sơ lỗi (backoff theo cấp số nhân), vì vậy OpenClaw có thể tiếp tục phản hồi ngay cả khi một nhà cung cấp bị giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều hơn các phản hồi `429` đơn thuần. OpenClaw
    cũng xem các thông báo như `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, và các giới hạn
    theo cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) là các giới hạn
    tốc độ đáng để chuyển đổi dự phòng.

    Một số phản hồi trông giống lỗi thanh toán không phải là `402`, và một số phản hồi HTTP `402`
    cũng vẫn nằm trong nhóm tạm thời đó. Nếu một nhà cung cấp trả về
    văn bản thanh toán rõ ràng trên `401` hoặc `403`, OpenClaw vẫn có thể giữ phản hồi đó trong
    nhánh thanh toán, nhưng các bộ khớp văn bản theo nhà cung cấp vẫn chỉ nằm trong phạm vi
    nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Nếu một thông báo `402`
    thay vào đó trông giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu của tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw xử lý nó là
    `rate_limit`, không phải vô hiệu hóa thanh toán dài hạn.

    Lỗi tràn ngữ cảnh thì khác: các chữ ký như
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, hoặc `ollama error: context length
    exceeded` vẫn đi theo đường dẫn Compaction/thử lại thay vì chuyển sang
    dự phòng mô hình.

    Văn bản lỗi máy chủ chung cố ý hẹp hơn "bất cứ thứ gì có
    unknown/error trong đó". OpenClaw có xử lý các dạng tạm thời theo phạm vi nhà cung cấp
    như Anthropic trần `An unknown error occurred`, OpenRouter trần
    `Provider returned error`, lỗi lý do dừng như `Unhandled stop reason:
    error`, payload JSON `api_error` có văn bản máy chủ tạm thời
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), và lỗi nhà cung cấp bận như `ModelNotReadyException` là
    tín hiệu hết thời gian/quá tải đáng để chuyển đổi dự phòng khi ngữ cảnh nhà cung cấp
    khớp.
    Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown
    error.` vẫn được xử lý thận trọng và tự nó không kích hoạt dự phòng mô hình.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" nghĩa là gì?'>
    Nó có nghĩa là hệ thống đã cố dùng ID hồ sơ xác thực `anthropic:default`, nhưng không tìm thấy thông tin xác thực của hồ sơ đó trong kho xác thực dự kiến.

    **Danh sách kiểm tra để sửa lỗi:**

    - **Xác nhận nơi lưu hồ sơ xác thực** (đường dẫn mới so với cũ)
      - Hiện tại: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Cũ: `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`)
    - **Xác nhận biến môi trường của bạn được Gateway tải**
      - Nếu bạn đặt `ANTHROPIC_API_KEY` trong shell nhưng chạy Gateway qua systemd/launchd, Gateway có thể không kế thừa biến đó. Đặt biến trong `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - **Đảm bảo bạn đang chỉnh sửa đúng tác tử**
      - Thiết lập nhiều tác tử có nghĩa là có thể có nhiều tệp `auth-profiles.json`.
    - **Kiểm tra nhanh trạng thái mô hình/xác thực**
      - Dùng `openclaw models status` để xem các mô hình đã cấu hình và nhà cung cấp đã được xác thực hay chưa.

    **Danh sách kiểm tra sửa lỗi cho "No credentials found for profile anthropic"**

    Điều này có nghĩa là lần chạy được ghim vào một hồ sơ xác thực Anthropic, nhưng Gateway
    không tìm thấy hồ sơ đó trong kho xác thực của mình.

    - **Dùng Claude CLI**
      - Chạy `openclaw models auth login --provider anthropic --method cli --set-default` trên máy chủ gateway.
    - **Nếu bạn muốn dùng khóa API thay thế**
      - Đặt `ANTHROPIC_API_KEY` trong `~/.openclaw/.env` trên **máy chủ gateway**.
      - Xóa mọi thứ tự được ghim đang ép dùng một hồ sơ bị thiếu:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Xác nhận bạn đang chạy lệnh trên máy chủ gateway**
      - Ở chế độ từ xa, hồ sơ xác thực nằm trên máy gateway, không phải máy tính xách tay của bạn.

  </Accordion>

  <Accordion title="Tại sao nó cũng thử Google Gemini rồi thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm dự phòng (hoặc bạn đã chuyển sang một dạng viết tắt Gemini), OpenClaw sẽ thử nó trong quá trình dự phòng mô hình. Nếu bạn chưa cấu hình thông tin xác thực Google, bạn sẽ thấy `No API key found for provider "google"`.

    Cách sửa: cung cấp xác thực Google, hoặc xóa/tránh các mô hình Google trong `agents.defaults.model.fallbacks` / alias để dự phòng không định tuyến tới đó.

    **Yêu cầu LLM bị từ chối: cần chữ ký thinking (Google Antigravity)**

    Nguyên nhân: lịch sử phiên chứa **các khối thinking không có chữ ký** (thường từ
    một luồng bị hủy/một phần). Google Antigravity yêu cầu chữ ký cho các khối thinking.

    Cách sửa: OpenClaw hiện loại bỏ các khối thinking chưa ký cho Google Antigravity Claude. Nếu lỗi vẫn xuất hiện, hãy bắt đầu một **phiên mới** hoặc đặt `/thinking off` cho tác tử đó.

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

    Để kiểm tra các hồ sơ đã lưu mà không xuất bí mật, hãy chạy `openclaw models auth list` (tùy chọn `--provider <id>` hoặc `--json`). Xem [CLI mô hình](/vi/cli/models#auth-profiles) để biết chi tiết.

  </Accordion>

  <Accordion title="Các ID hồ sơ điển hình là gì?">
    OpenClaw dùng các ID có tiền tố nhà cung cấp như:

    - `anthropic:default` (phổ biến khi không có danh tính email)
    - `anthropic:<email>` cho danh tính OAuth
    - ID tùy chỉnh bạn chọn (ví dụ: `anthropic:work`)

  </Accordion>

  <Accordion title="Tôi có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình hỗ trợ siêu dữ liệu tùy chọn cho hồ sơ và một thứ tự theo từng nhà cung cấp (`auth.order.<provider>`). Việc này **không** lưu bí mật; nó ánh xạ ID tới nhà cung cấp/chế độ và đặt thứ tự luân phiên.

    OpenClaw có thể tạm thời bỏ qua một hồ sơ nếu hồ sơ đó đang trong **thời gian chờ hồi phục** ngắn (giới hạn tốc độ/hết thời gian/lỗi xác thực) hoặc trạng thái **vô hiệu hóa** dài hơn (thanh toán/không đủ tín dụng). Để kiểm tra điều này, chạy `openclaw models status --json` và kiểm tra `auth.unusableProfiles`. Điều chỉnh: `auth.cooldowns.billingBackoffHours*`.

    Thời gian chờ hồi phục do giới hạn tốc độ có thể theo phạm vi mô hình. Một hồ sơ đang chờ hồi phục
    cho một mô hình vẫn có thể dùng được cho mô hình cùng nhóm trên cùng nhà cung cấp,
    trong khi các cửa sổ thanh toán/vô hiệu hóa vẫn chặn toàn bộ hồ sơ.

    Bạn cũng có thể đặt ghi đè thứ tự **theo từng tác tử** (được lưu trong `auth-state.json` của tác tử đó) qua CLI:

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

    Để nhắm tới một tác tử cụ thể:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Để xác minh những gì thực sự sẽ được thử, dùng:

    ```bash
    openclaw models status --probe
    ```

    Nếu một hồ sơ đã lưu bị bỏ qua khỏi thứ tự rõ ràng, probe báo cáo
    `excluded_by_auth_order` cho hồ sơ đó thay vì âm thầm thử nó.

  </Accordion>

  <Accordion title="OAuth so với khóa API - khác nhau ở đâu?">
    OpenClaw hỗ trợ cả hai:

    - **OAuth** thường tận dụng quyền truy cập theo gói đăng ký (khi áp dụng).
    - **Khóa API** dùng thanh toán theo token.

    Trình hướng dẫn hỗ trợ rõ ràng Anthropic Claude CLI, OpenAI Codex OAuth và khóa API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Câu hỏi thường gặp](/vi/help/faq) — câu hỏi thường gặp chính
- [Câu hỏi thường gặp — thiết lập khởi động nhanh và lần chạy đầu tiên](/vi/help/faq-first-run)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Dự phòng mô hình](/vi/concepts/model-failover)
