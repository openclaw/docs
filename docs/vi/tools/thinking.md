---
read_when:
    - Điều chỉnh việc phân tích cú pháp hoặc giá trị mặc định của các chỉ thị thinking, fast-mode hoặc verbose
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị suy luận
title: Các mức độ suy nghĩ
x-i18n:
    generated_at: "2026-04-30T16:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Tác dụng

- Chỉ thị nội tuyến trong mọi nội dung nhận vào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (ngân sách tối đa)
  - xhigh → “ultrathink+” (mô hình GPT-5.2+ và Codex, cộng với effort Anthropic Claude Opus 4.7)
  - adaptive → suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7, và suy nghĩ động Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7; Ollama ánh xạ mức này tới effort `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn suy nghĩ được điều khiển bởi hồ sơ nhà cung cấp. Plugin nhà cung cấp khai báo chính xác tập mức cho mô hình đã chọn, bao gồm các nhãn như `on` nhị phân.
  - `adaptive`, `xhigh`, và `max` chỉ được quảng bá cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Các chỉ thị được nhập cho mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` quay về `medium` trên các mô hình không thích ứng, trong khi `xhigh` và `max` quay về mức không phải `off` lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi không đặt mức suy nghĩ rõ ràng.
  - Anthropic Claude Opus 4.7 không mặc định dùng suy nghĩ thích ứng. Mặc định effort API của nó vẫn thuộc quyền nhà cung cấp trừ khi bạn đặt rõ ràng một mức suy nghĩ.
  - Anthropic Claude Opus 4.7 ánh xạ `/think xhigh` tới suy nghĩ thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị suy nghĩ và `xhigh` là thiết lập effort của Opus 4.7.
  - Anthropic Claude Opus 4.7 cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn effort tối đa thuộc quyền nhà cung cấp.
  - Các mô hình DeepSeek V4 cung cấp `/think xhigh|max`; cả hai ánh xạ tới DeepSeek `reasoning_effort: "max"` trong khi các mức không phải `off` thấp hơn ánh xạ tới `high`.
  - Các mô hình Ollama có khả năng suy nghĩ cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi effort `low`, `medium`, và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua hỗ trợ effort của Responses API theo từng mô hình. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận đã tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục catalog tương thích OpenAI tùy chỉnh có thể bật `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` để bao gồm `"xhigh"`. Việc này dùng cùng metadata tương thích ánh xạ payload effort suy luận OpenAI gửi đi, nên menu, xác thực phiên, CLI tác tử, và `llm-task` khớp với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình lỗi thời bỏ qua việc chèn suy luận proxy vì tuyến đã ngừng đó có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` tới suy nghĩ động thuộc quyền nhà cung cấp của Gemini. Yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, trong khi yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax (`minimax/*`) trên đường dẫn streaming tương thích Anthropic mặc định là `thinking: { type: "disabled" }` trừ khi bạn đặt rõ ràng suy nghĩ trong tham số mô hình hoặc tham số yêu cầu. Việc này tránh rò rỉ delta `reasoning_content` từ định dạng stream Anthropic không gốc của MiniMax.
  - Z.AI (`zai/*`) chỉ hỗ trợ suy nghĩ nhị phân (`on`/`off`). Bất kỳ mức nào không phải `off` đều được coi là `on` (ánh xạ tới `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` tới `thinking: { type: "disabled" }` và mọi mức không phải `off` tới `thinking: { type: "enabled" }`. Khi bật suy nghĩ, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi tin nhắn chỉ có chỉ thị).
3. Mặc định theo tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` được hỗ trợ gần nhất cho mô hình đó, và các mô hình không suy luận giữ nguyên `off`.

## Đặt mặc định phiên

- Gửi một tin nhắn **chỉ** có chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó được giữ cho phiên hiện tại (mặc định theo người gửi); được xóa bằng `/think:off` hoặc đặt lại khi phiên nhàn rỗi.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên giữ nguyên.
- Gửi `/think` (hoặc `/think:`) không có đối số để xem mức suy nghĩ hiện tại.

## Áp dụng theo tác tử

- **Pi nhúng**: mức đã phân giải được truyền tới runtime tác tử Pi trong tiến trình.

## Chế độ nhanh (/fast)

- Mức: `on|off`.
- Tin nhắn chỉ có chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và trả lời `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Nội tuyến/chỉ thị thuần `/fast on|off`
  2. Ghi đè phiên
  3. Mặc định theo tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với `openai-codex/*`, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. OpenClaw giữ một công tắc `/fast` dùng chung trên cả hai đường dẫn xác thực.
- Với các yêu cầu `anthropic/*` công khai trực tiếp, bao gồm lưu lượng xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số mô hình Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai được đặt. OpenClaw vẫn bỏ qua việc chèn tầng dịch vụ Anthropic cho URL cơ sở proxy không phải Anthropic.
- `/status` chỉ hiển thị `Fast` khi chế độ nhanh được bật.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt chi tiết phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên rõ ràng; xóa nó qua UI Sessions bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không có đối số để xem mức chi tiết hiện tại.
- Khi bật chi tiết, các tác tử phát kết quả công cụ có cấu trúc (Pi, các tác tử JSON khác) gửi từng lệnh gọi công cụ trở lại dưới dạng tin nhắn riêng chỉ có metadata, có tiền tố `<emoji> <tool-name>: <arg>` khi có (đường dẫn/lệnh). Các tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta streaming.
- Tóm tắt lỗi công cụ vẫn hiển thị trong chế độ bình thường, nhưng các hậu tố chi tiết lỗi thô bị ẩn trừ khi chi tiết là `on` hoặc `full`.
- Khi chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn tới độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo thiết lập mới.

## Chỉ thị trace Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt đầu ra trace Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không có đối số để xem mức trace hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ phơi bày các dòng trace/gỡ lỗi thuộc sở hữu Plugin, chẳng hạn tóm tắt gỡ lỗi Active Memory.
- Các dòng trace có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán theo sau sau phản hồi trợ lý bình thường.

## Khả năng hiển thị suy luận (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ có chỉ thị bật/tắt việc hiển thị các khối suy nghĩ trong phản hồi.
- Khi được bật, suy luận được gửi dưới dạng **tin nhắn riêng** có tiền tố `Reasoning:`.
- `stream` (chỉ Telegram): streaming suy luận vào bong bóng nháp Telegram trong khi phản hồi đang được tạo, rồi gửi câu trả lời cuối cùng không có suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo tác tử (`agents.list[].reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận mô hình cục bộ sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trên phản hồi bình thường, và suy luận chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bọc hoàn toàn trong một thẻ mở chưa đóng duy nhất và nếu không sẽ được gửi dưới dạng văn bản rỗng, OpenClaw xóa thẻ mở sai định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng cao nằm trong [Chế độ nâng cao](/vi/tools/elevated).

## Heartbeat

- Nội dung probe Heartbeat là prompt heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Chỉ thị nội tuyến trong tin nhắn heartbeat áp dụng như bình thường (nhưng tránh thay đổi mặc định phiên từ heartbeat).
- Phân phối Heartbeat mặc định chỉ gửi payload cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc theo tác tử `agents.list[].heartbeat.includeReasoning: true`.

## UI chat web

- Bộ chọn suy nghĩ của chat web phản chiếu mức đã lưu của phiên từ kho phiên nhận vào/cấu hình khi trang tải.
- Chọn mức khác ghi ghi đè phiên ngay lập tức qua `sessions.patch`; nó không chờ lần gửi tiếp theo và không phải ghi đè dùng một lần `thinkingOnce`.
- Tùy chọn đầu tiên luôn là `Default (<resolved level>)`, trong đó mặc định đã phân giải đến từ hồ sơ suy nghĩ của nhà cung cấp mô hình phiên đang hoạt động cộng với cùng logic dự phòng mà `/status` và `session_status` dùng.
- Bộ chọn dùng `thinkingLevels` được trả về bởi hàng/mặc định phiên Gateway, với `thinkingOptions` được giữ làm danh sách nhãn kế thừa. UI trình duyệt không giữ danh sách regex nhà cung cấp riêng; Plugin sở hữu các tập mức theo từng mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nên chỉ thị chat và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các Plugin nhà cung cấp có thể cung cấp `resolveThinkingProfile(ctx)` để xác định các mức được hỗ trợ và giá trị mặc định của mô hình.
- Các Plugin nhà cung cấp làm proxy cho mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục proxy luôn đồng bộ.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu trữ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm `label` hiển thị. Nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Các Plugin công cụ cần xác thực một ghi đè suy luận rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên duy trì danh sách mức nhà cung cấp/mô hình riêng.
- Các Plugin công cụ có quyền truy cập vào siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các lựa chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía Plugin.
- Các hook kế thừa đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn là các adapter tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Các hàng/giá trị mặc định của Gateway cung cấp `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các client ACP/chat hiển thị cùng các id và nhãn hồ sơ mà xác thực thời gian chạy sử dụng.
