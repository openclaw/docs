---
read_when:
    - Chọn hoặc chuyển đổi mô hình, cấu hình bí danh
    - Gỡ lỗi chuyển đổi dự phòng mô hình / "Tất cả mô hình đều thất bại"
    - Tìm hiểu về hồ sơ xác thực và cách quản lý chúng
sidebarTitle: Models FAQ
summary: 'Câu hỏi thường gặp: mô hình mặc định, lựa chọn, bí danh, chuyển đổi, chuyển đổi dự phòng và hồ sơ xác thực'
title: 'Câu hỏi thường gặp: mô hình và xác thực'
x-i18n:
    generated_at: "2026-07-20T04:39:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73272916f3db17d101c777639c5a5153bfbcfa887929a5726f3c94c3cb29aaf9
    source_path: help/faq-models.md
    workflow: 16
---

Hỏi đáp về mô hình và hồ sơ xác thực. Để biết về thiết lập, phiên, gateway, kênh và
khắc phục sự cố, hãy xem [Câu hỏi thường gặp](/vi/help/faq) chính.

## Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi

<AccordionGroup>
  <Accordion title='"Mô hình mặc định" là gì?'>
    Thiết lập bằng:

    ```text
    agents.defaults.model.primary
    ```

    Các mô hình là các tham chiếu `provider/model` (ví dụ: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Luôn đặt `provider/model` một cách tường minh. Nếu
    bạn bỏ qua nhà cung cấp, OpenClaw trước tiên thử khớp bí danh, sau đó khớp
    duy nhất với nhà cung cấp đã cấu hình cho id mô hình đó, rồi chuyển về nhà
    cung cấp mặc định đã cấu hình (đường dẫn tương thích đã lỗi thời). Nếu nhà
    cung cấp đó không còn có mô hình mặc định đã cấu hình, OpenClaw sẽ chuyển
    sang nhà cung cấp/mô hình đầu tiên đã cấu hình thay vì dùng giá trị mặc định cũ.

  </Accordion>

  <Accordion title="Bạn đề xuất mô hình nào?">
    Sử dụng mô hình thế hệ mới nhất và mạnh nhất mà hệ thống nhà cung cấp của
    bạn cung cấp, đặc biệt cho các tác nhân có bật công cụ hoặc xử lý đầu vào
    không đáng tin cậy — các mô hình yếu hơn hoặc bị lượng tử hóa quá mức dễ bị
    chèn prompt và có hành vi không an toàn hơn (xem [Bảo mật](/vi/gateway/security)).
    Định tuyến các mô hình rẻ hơn đến những cuộc trò chuyện thường lệ/ít rủi ro
    theo vai trò tác nhân.

    Định tuyến mô hình theo từng tác nhân và dùng tác nhân con để song song hóa
    các tác vụ dài (mỗi tác nhân con tiêu thụ token riêng). Xem
    [Mô hình](/vi/concepts/models), [Tác nhân con](/vi/tools/subagents),
    [MiniMax](/vi/providers/minimax) và [Mô hình cục bộ](/vi/gateway/local-models).

  </Accordion>

  <Accordion title="Làm cách nào để chuyển mô hình mà không xóa cấu hình?">
    Chỉ thay đổi các trường mô hình — tránh thay thế toàn bộ cấu hình.

    - `/model` trong cuộc trò chuyện (theo từng phiên, xem [Lệnh dấu gạch chéo](/vi/tools/slash-commands))
    - `openclaw models set ...` (chỉ cập nhật cấu hình mô hình)
    - `openclaw configure --section model` (tương tác)
    - chỉnh sửa trực tiếp `agents.defaults.model` trong `~/.openclaw/openclaw.json`

    Đối với chỉnh sửa RPC, trước tiên hãy kiểm tra bằng `config.schema.lookup`
    (đường dẫn đã chuẩn hóa, tài liệu schema nông, phần tóm tắt mục con), sau đó
    ưu tiên `config.patch` thay vì `config.apply` với một đối tượng một
    phần. Nếu bạn đã ghi đè cấu hình, hãy khôi phục từ bản sao lưu hoặc chạy
    `openclaw doctor` để sửa chữa.

    Tài liệu: [Mô hình](/vi/concepts/models), [Cấu hình](/vi/cli/configure),
    [Cấu hình](/vi/cli/config), [Doctor](/vi/gateway/doctor).

  </Accordion>

  <Accordion title="Tôi có thể dùng các mô hình tự lưu trữ (llama.cpp, vLLM, Ollama) không?">
    Có — Ollama là cách dễ nhất. Thiết lập nhanh:

    1. Cài đặt Ollama từ `https://ollama.com/download`
    2. Kéo một mô hình cục bộ, ví dụ `ollama pull gemma4`
    3. Để dùng cả mô hình đám mây, hãy chạy `ollama signin`
    4. Chạy `openclaw onboard`, chọn `Ollama`, sau đó chọn `Local` hoặc `Cloud + Local`

    `Cloud + Local` cung cấp cho bạn các mô hình đám mây cùng với các mô
    hình Ollama cục bộ; các mô hình đám mây như `kimi-k2.5:cloud` không cần
    kéo về cục bộ. Để chuyển thủ công: `openclaw models list`, sau đó
    `openclaw models set ollama/<model>`.

    Các mô hình nhỏ hơn/bị lượng tử hóa mạnh dễ bị chèn prompt hơn. Hãy dùng
    mô hình lớn cho mọi bot có quyền truy cập công cụ; nếu vẫn dùng mô hình nhỏ,
    hãy bật sandbox và danh sách cho phép công cụ nghiêm ngặt.

    Tài liệu: [Ollama](/vi/providers/ollama), [Mô hình cục bộ](/vi/gateway/local-models),
    [Nhà cung cấp mô hình](/vi/concepts/model-providers), [Bảo mật](/vi/gateway/security),
    [Sandbox](/vi/gateway/sandboxing).

  </Accordion>

  <Accordion title="Làm cách nào để chuyển mô hình tức thời (mà không khởi động lại)?">
    Gửi `/model <name>` dưới dạng một tin nhắn độc lập. Xem
    [Lệnh dấu gạch chéo](/vi/tools/slash-commands) để biết
    danh sách lệnh đầy đủ, bao gồm bộ chọn đánh số (`/model`, `/model
    list`, `/model 3`), `/model default` để xóa ghi đè phiên và
    `/model status` để biết chi tiết về endpoint/chế độ API.

    Buộc dùng một hồ sơ xác thực cụ thể cho từng phiên bằng `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Để bỏ ghim hồ sơ đã đặt bằng `@profile`, hãy chạy lại
    `/model` mà không có hậu tố (ví dụ `/model anthropic/claude-opus-4-6`), hoặc chọn
    giá trị mặc định từ `/model`. Dùng `/model status` để xác nhận
    hồ sơ xác thực đang hoạt động.

  </Accordion>

  <Accordion title="Nếu hai nhà cung cấp cung cấp cùng một id mô hình, /model sẽ dùng nhà cung cấp nào?">
    `/model provider/model` chọn chính xác tuyến nhà cung cấp đó. Ví dụ,
    `qianfan/deepseek-v4-flash` và `deepseek/deepseek-v4-flash` là các tham chiếu khác nhau
    dù id mô hình giống nhau — OpenClaw không âm thầm chuyển nhà cung cấp khi
    chỉ khớp id đơn thuần.

    Tham chiếu `/model` do người dùng chọn áp dụng nghiêm ngặt cho
    việc dự phòng: nếu nhà cung cấp/mô hình đó không còn khả dụng, phản hồi sẽ
    thất bại rõ ràng thay vì chuyển về `agents.defaults.model.fallbacks`. Các chuỗi dự phòng
    đã cấu hình vẫn áp dụng cho giá trị mặc định đã cấu hình, mô hình chính của
    công việc cron và trạng thái dự phòng được chọn tự động. Khi một lượt chạy
    không ghi đè phiên được phép dùng dự phòng, OpenClaw trước tiên thử nhà
    cung cấp/mô hình được yêu cầu, sau đó các lựa chọn dự phòng đã cấu hình, rồi
    đến mô hình chính đã cấu hình — vì vậy các id mô hình đơn thuần trùng nhau
    không bao giờ chuyển thẳng về nhà cung cấp mặc định.

    Xem [Mô hình](/vi/concepts/models) và [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>

  <Accordion title="Tôi có thể dùng GPT 5.5 cho tác vụ hằng ngày và Codex 5.5 để lập trình không?">
    Có — lựa chọn mô hình và lựa chọn runtime là hai việc riêng biệt:

    - **Tác nhân lập trình Codex gốc:** đặt `agents.defaults.model.primary` thành
      `openai/gpt-5.5`. Đăng nhập bằng `openclaw models auth login --provider
      openai` để xác thực bằng gói đăng ký ChatGPT/Codex.
    - **Tác vụ OpenAI API trực tiếp bên ngoài vòng lặp tác nhân:** cấu hình
      `OPENAI_API_KEY` cho hình ảnh, embedding, giọng nói, thời gian thực và
      các bề mặt OpenAI API không dành cho tác nhân khác.
    - **Xác thực tác nhân OpenAI bằng khóa API:** `/model openai/gpt-5.5` với một
      hồ sơ khóa API `openai` có thứ tự.
    - **Tác nhân con:** định tuyến tác vụ lập trình đến một tác nhân chuyên
      về Codex với mô hình `openai/gpt-5.5` riêng.

    Xem [Mô hình](/vi/concepts/models) và [Lệnh dấu gạch chéo](/vi/tools/slash-commands).

  </Accordion>

  <Accordion title="Làm cách nào để cấu hình chế độ nhanh cho GPT 5.5?">
    - **Theo từng phiên:** gửi `/fast on` khi đang dùng `openai/gpt-5.5`.
    - **Mặc định theo từng mô hình:** đặt
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` thành `true`.
    - **Ngưỡng ngắt tự động:** `/fast auto` hoặc `params.fastMode: "auto"` chạy
      nhanh các lệnh gọi mô hình mới cho đến ngưỡng ngắt, sau đó chạy các lệnh
      gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục về sau mà không có
      chế độ nhanh. Ngưỡng ngắt mặc định là 60 giây; ghi đè bằng
      `params.fastAutoOnSeconds` trên mô hình.

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

    Chế độ nhanh ánh xạ đến `service_tier = "priority"` trên các yêu cầu OpenAI
    Responses gốc; các giá trị `service_tier` hiện có được giữ nguyên và
    chế độ nhanh không ghi lại `reasoning` hoặc `text.verbosity`. Các
    ghi đè `/fast` của phiên được ưu tiên hơn giá trị mặc định trong
    cấu hình.

    Xem [Suy luận và chế độ nhanh](/vi/tools/thinking) và phần Chế độ nhanh
    trong Cấu hình nâng cao trên trang nhà cung cấp [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Model ... is not allowed" rồi không có phản hồi?'>
    Nếu `agents.defaults.modelPolicy.allow` không rỗng, nó trở thành
    **danh sách cho phép** cho `/model`, các ghi đè phiên và
    `--model`. Việc chọn một mô hình ngoài danh sách đó sẽ trả về nội
    dung sau thay vì phản hồi thông thường:

    ```text
    Model override "provider/model" is not allowed by agents.defaults.modelPolicy.allow.
    ```

    Cách khắc phục: thêm chính xác mô hình hoặc ký tự đại diện nhà cung cấp như
    `"provider/*"` vào danh sách `modelPolicy.allow` được nêu tên, xóa/làm
    rỗng danh sách đó hoặc chọn một mô hình từ `/model list`. Nếu lệnh
    cũng bao gồm `--runtime codex`, trước tiên hãy cập nhật danh sách cho
    phép, sau đó thử lại cùng lệnh `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Tại sao tôi thấy "Unknown model: minimax/MiniMax-M3"?'>
    Nếu bạn đang dùng một bản phát hành OpenClaw cũ, trước tiên hãy nâng cấp
    (hoặc chạy từ mã nguồn `main`) và khởi động lại Gateway —
    `MiniMax-M3` có thể chưa có trong danh mục của bản phát hành đã cài
    đặt. Nếu không, nhà cung cấp MiniMax chưa được cấu hình (không tìm thấy mục
    nhà cung cấp hoặc hồ sơ xác thực), nên không thể phân giải mô hình. Xem
    phần Khắc phục sự cố trên trang nhà cung cấp
    [MiniMax](/vi/providers/minimax) để biết danh sách kiểm tra khắc phục đầy đủ,
    bảng id nhà cung cấp/mô hình và ví dụ khối cấu hình.

  </Accordion>

  <Accordion title="Tôi có thể dùng MiniMax làm mặc định và OpenAI cho các tác vụ phức tạp không?">
    Có. Dùng MiniMax làm mặc định và chuyển mô hình theo từng phiên — các lựa
    chọn dự phòng dành cho lỗi, không phải "tác vụ khó", vì vậy hãy dùng
    `/model` hoặc một tác nhân riêng.

    **Tùy chọn A: chuyển theo từng phiên**

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

    Sau đó `/model gpt`.

    **Tùy chọn B: các tác nhân riêng biệt** — Tác nhân A mặc định dùng MiniMax,
    Tác nhân B mặc định dùng OpenAI; định tuyến theo tác nhân hoặc dùng
    `/agent` để chuyển đổi.

    Tài liệu: [Mô hình](/vi/concepts/models), [Định tuyến đa tác nhân](/vi/concepts/multi-agent),
    [MiniMax](/vi/providers/minimax), [OpenAI](/vi/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt có phải là lối tắt tích hợp sẵn không?">
    Có — đây là các dạng viết tắt tích hợp sẵn, chỉ được áp dụng khi mô hình
    đích tồn tại trong `agents.defaults.models`:

    | Bí danh | Phân giải thành |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Bí danh riêng của bạn có cùng tên sẽ ghi đè bí danh tích hợp sẵn.

  </Accordion>

  <Accordion title="Làm cách nào để định nghĩa/ghi đè lối tắt mô hình (bí danh)?">
    Các bí danh nằm tại `agents.defaults.models.<modelId>.alias`:

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

    Sau đó `/model sonnet` (hoặc `/<alias>` khi được hỗ trợ) sẽ
    phân giải thành id mô hình đó.

  </Accordion>

  <Accordion title="Làm cách nào để thêm mô hình từ các nhà cung cấp khác như OpenRouter hoặc Z.AI?">
    OpenRouter (trả phí theo token; nhiều mô hình):

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Thiếu khóa nhà cung cấp cho một nhà cung cấp/mô hình được tham chiếu sẽ gây
    ra lỗi xác thực runtime (ví dụ `No API key found for provider "zai"`).

    **Không tìm thấy khóa API cho nhà cung cấp sau khi thêm tác nhân mới**

    Tác nhân mới có kho xác thực trống — xác thực được lưu riêng theo từng tác
    nhân tại:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Khắc phục: chạy `openclaw agents add <id>` và cấu hình xác thực trong trình hướng dẫn, hoặc
    chỉ sao chép các hồ sơ tĩnh có tính di động `api_key`/`token` từ kho của
    tác nhân chính. Đối với OAuth, hãy đăng nhập từ tác nhân mới khi tác nhân đó cần
    tài khoản riêng. Xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent) để biết đầy đủ
    các quy tắc tái sử dụng `agentDir` và chia sẻ thông tin xác thực — tuyệt đối không tái sử dụng
    `agentDir` giữa các tác nhân.

  </Accordion>
</AccordionGroup>

## Chuyển đổi dự phòng mô hình và "Tất cả mô hình đều thất bại"

<AccordionGroup>
  <Accordion title="Cơ chế chuyển đổi dự phòng hoạt động như thế nào?">
    Hai giai đoạn:

    1. **Luân phiên hồ sơ xác thực** trong cùng một nhà cung cấp.
    2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

    Thời gian tạm ngưng được áp dụng cho các hồ sơ gặp lỗi (thời gian chờ tăng theo cấp số nhân), nhờ đó OpenClaw
    tiếp tục phản hồi khi nhà cung cấp giới hạn tốc độ hoặc tạm thời gặp lỗi.

    Nhóm giới hạn tốc độ bao gồm nhiều trường hợp hơn `429` thông thường: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` và các giới hạn
    cửa sổ sử dụng định kỳ (`weekly/monthly limit reached`) đều được tính là
    giới hạn tốc độ đủ điều kiện để chuyển đổi dự phòng.

    Phản hồi thanh toán không phải lúc nào cũng là `402`, và một số `402` vẫn nằm trong
    nhóm tạm thời/giới hạn tốc độ thay vì luồng thanh toán. Nội dung thanh toán rõ ràng trên
    `401`/`403` vẫn có thể được định tuyến sang luồng thanh toán; các bộ so khớp
    văn bản dành riêng cho nhà cung cấp (ví dụ: OpenRouter `Key limit exceeded`) vẫn chỉ áp dụng cho
    chính nhà cung cấp đó. Một `402` có nội dung giống giới hạn cửa sổ sử dụng có thể thử lại hoặc
    giới hạn chi tiêu của tổ chức/không gian làm việc (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) được xử lý là `rate_limit`, chứ không phải
    trạng thái vô hiệu hóa dài hạn do thanh toán.

    Lỗi tràn ngữ cảnh hoàn toàn không đi theo đường dẫn dự phòng — các dấu hiệu
    như `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` hoặc `ollama error: context length exceeded` sẽ chuyển sang
    Compaction/thử lại thay vì chuyển sang mô hình dự phòng tiếp theo.

    Văn bản lỗi máy chủ chung có phạm vi hẹp hơn "bất kỳ nội dung nào chứa unknown/error".
    Các dạng lỗi tạm thời theo từng nhà cung cấp được tính là tín hiệu chuyển đổi dự phòng:
    `An unknown error occurred` độc lập của Anthropic, `Provider returned error` độc lập của
    OpenRouter, lỗi lý do dừng như `Unhandled stop reason:
    error`, tải trọng JSON `api_error` chứa văn bản lỗi máy chủ tạm thời (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    và lỗi nhà cung cấp đang bận như `ModelNotReadyException` khi ngữ cảnh nhà cung cấp
    khớp. Văn bản dự phòng nội bộ chung như `LLM request failed
    with an unknown error.` được xử lý thận trọng và tự nó không kích hoạt chuyển đổi dự phòng.

  </Accordion>

  <Accordion title='Thông báo "No credentials found for profile anthropic:default" có nghĩa là gì?'>
    ID hồ sơ xác thực `anthropic:default` không có thông tin xác thực trong
    kho xác thực dự kiến.

    **Danh sách kiểm tra để khắc phục:**

    - Xác nhận vị trí lưu hồ sơ — hiện tại:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; cũ:
      `~/.openclaw/agent/*` (được di chuyển bởi `openclaw doctor`).
    - Xác nhận Gateway tải biến môi trường của bạn. `ANTHROPIC_API_KEY` chỉ được đặt trong
      shell của bạn sẽ không đến được Gateway chạy qua systemd/launchd — hãy đặt biến đó trong
      `~/.openclaw/.env` hoặc bật `env.shellEnv`.
    - Xác nhận bạn đang chỉnh sửa đúng tác nhân — cấu hình đa tác nhân có
      nhiều tệp `auth-profiles.json`.
    - Chạy `openclaw models status` để xem các mô hình đã cấu hình và trạng thái
      xác thực của nhà cung cấp.

    **Đối với "No credentials found for profile anthropic" (không có hậu tố email):**

    Lần chạy được ghim vào một hồ sơ Anthropic mà Gateway không thể tìm thấy.

    - Dùng Claude CLI: chạy `openclaw models auth login --provider anthropic
      --method cli --set-default` trên máy chủ Gateway.
    - Nếu ưu tiên khóa API: đặt `ANTHROPIC_API_KEY` trong
      `~/.openclaw/.env` trên máy chủ Gateway, sau đó xóa mọi thứ tự đã ghim
      đang buộc sử dụng hồ sơ bị thiếu:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Chế độ từ xa: hồ sơ xác thực nằm trên máy Gateway, không phải
      máy tính xách tay của bạn — hãy xác nhận bạn đang chạy các lệnh tại đó.

  </Accordion>

  <Accordion title="Tại sao hệ thống cũng thử Google Gemini và thất bại?">
    Nếu cấu hình mô hình của bạn bao gồm Google Gemini làm phương án dự phòng (hoặc bạn
    đã chuyển sang dạng viết tắt của Gemini), OpenClaw sẽ thử mô hình đó trong quá trình chuyển đổi dự phòng. Nếu không
    cấu hình thông tin xác thực Google, hệ thống sẽ trả về `No API key found for provider
    "google"`. Khắc phục: thêm xác thực Google hoặc xóa các mô hình Google khỏi
    `agents.defaults.model.fallbacks`/bí danh.

    **Yêu cầu LLM bị từ chối: bắt buộc có chữ ký suy luận (Google Antigravity)**

    Nguyên nhân: lịch sử phiên có các khối suy luận không kèm chữ ký (thường
    do luồng bị hủy hoặc chỉ hoàn tất một phần); Google Antigravity yêu cầu chữ ký
    trên các khối suy luận. OpenClaw loại bỏ các khối suy luận không có chữ ký đối với Google
    Antigravity Claude; nếu lỗi vẫn xuất hiện, hãy bắt đầu một phiên mới hoặc đặt
    `/thinking off` cho tác nhân đó.

  </Accordion>
</AccordionGroup>

## Hồ sơ xác thực: khái niệm và cách quản lý

Liên quan: [/concepts/oauth](/vi/concepts/oauth) (luồng OAuth, lưu trữ token, mẫu sử dụng nhiều tài khoản)

<AccordionGroup>
  <Accordion title="Hồ sơ xác thực là gì?">
    Một bản ghi thông tin xác thực có tên (OAuth hoặc khóa API) được liên kết với một nhà cung cấp, lưu tại:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Kiểm tra các hồ sơ đã lưu mà không hiển thị bí mật: `openclaw models auth
    list` (có thể thêm `--provider <id>` hoặc `--json`). Xem
    [CLI mô hình](/vi/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Các ID hồ sơ thường gặp là gì?">
    Có tiền tố nhà cung cấp: `anthropic:default` (thường dùng khi không có danh tính
    email), `anthropic:<email>` cho danh tính OAuth hoặc một ID tùy chỉnh do bạn
    chọn (ví dụ: `anthropic:work`).

  </Accordion>

  <Accordion title="Có thể kiểm soát hồ sơ xác thực nào được thử trước không?">
    Có. Cấu hình `auth.order.<provider>` đặt thứ tự luân phiên theo từng nhà cung cấp
    (chỉ là siêu dữ liệu — không lưu bí mật).

    OpenClaw có thể bỏ qua một hồ sơ đang trong thời gian **tạm ngưng** ngắn (giới hạn tốc độ,
    hết thời gian chờ, lỗi xác thực) hoặc trạng thái **vô hiệu hóa** dài hơn
    (thanh toán/không đủ tín dụng). Kiểm tra bằng `openclaw models status
    --json` và xem `auth.unusableProfiles`. Thời gian tạm ngưng do giới hạn tốc độ có thể
    áp dụng theo từng mô hình — một hồ sơ đang tạm ngưng đối với một mô hình vẫn có thể phục vụ
    mô hình cùng nhóm trên chính nhà cung cấp đó; cửa sổ thanh toán/vô hiệu hóa sẽ chặn
    toàn bộ hồ sơ.

    Đặt thứ tự ghi đè theo từng tác nhân (được lưu trong `auth-state.json` của tác nhân đó):

    ```bash
    # Mặc định dùng tác nhân mặc định đã cấu hình (bỏ qua --agent)
    openclaw models auth order get --provider anthropic

    # Khóa việc luân phiên vào một hồ sơ duy nhất
    openclaw models auth order set --provider anthropic anthropic:default

    # Hoặc đặt thứ tự rõ ràng (dự phòng trong cùng nhà cung cấp)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Xóa ghi đè (quay về auth.order trong cấu hình / luân phiên vòng tròn)
    openclaw models auth order clear --provider anthropic

    # Nhắm đến một tác nhân cụ thể
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Xác minh những hồ sơ thực sự sẽ được thử: `openclaw models status --probe`. Một
    hồ sơ đã lưu nhưng bị loại khỏi thứ tự rõ ràng sẽ báo cáo
    `excluded_by_auth_order` thay vì được thử một cách âm thầm.

  </Accordion>

  <Accordion title="OAuth và khóa API khác nhau như thế nào?">
    - **Đăng nhập bằng OAuth / CLI** thường sử dụng quyền truy cập theo gói đăng ký khi
      nhà cung cấp hỗ trợ. Đối với Anthropic, phần phụ trợ Claude CLI của OpenClaw
      sử dụng Claude Code `claude -p`, hiện được Anthropic xem là
      hoạt động sử dụng Agent SDK/lập trình, được tính vào giới hạn sử dụng của gói đăng ký —
      xem [Anthropic](/vi/providers/anthropic) để biết trạng thái tạm dừng thanh toán
      hiện tại và các liên kết nguồn.
    - **Khóa API** sử dụng cơ chế tính phí theo token.

    Trình hướng dẫn hỗ trợ Anthropic Claude CLI, OpenAI Codex OAuth và khóa
    API.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Câu hỏi thường gặp](/vi/help/faq) — trang câu hỏi thường gặp chính
- [Câu hỏi thường gặp — bắt đầu nhanh và thiết lập lần chạy đầu tiên](/vi/help/faq-first-run)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
