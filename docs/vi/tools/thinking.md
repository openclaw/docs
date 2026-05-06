---
read_when:
    - Điều chỉnh cách phân tích cú pháp hoặc giá trị mặc định cho các chỉ thị suy luận, chế độ nhanh hoặc chi tiết
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị lập luận
title: Các mức độ tư duy
x-i18n:
    generated_at: "2026-05-06T09:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong bất kỳ nội dung gửi đến nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (ngân sách tối đa)
  - xhigh → "ultrathink+" (các model GPT-5.2+ và Codex, cùng effort Anthropic Claude Opus 4.7)
  - adaptive → suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7, và suy nghĩ động của Google Gemini)
  - max → reasoning tối đa của nhà cung cấp (Anthropic Claude Opus 4.7; Ollama ánh xạ mức này sang effort `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn suy nghĩ được điều khiển bởi hồ sơ nhà cung cấp. Plugin nhà cung cấp khai báo tập mức chính xác cho model đã chọn, bao gồm các nhãn như `on` dạng nhị phân.
  - `adaptive`, `xhigh`, và `max` chỉ được hiển thị cho các hồ sơ nhà cung cấp/model hỗ trợ chúng. Các chỉ thị đã nhập cho mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của model đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` quay về `medium` trên các model không thích ứng, còn `xhigh` và `max` quay về mức không phải `off` lớn nhất được hỗ trợ cho model đã chọn.
  - Các model Anthropic Claude 4.6 mặc định dùng `adaptive` khi chưa đặt mức suy nghĩ rõ ràng.
  - Anthropic Claude Opus 4.7 không mặc định dùng suy nghĩ thích ứng. Mặc định effort API của nó vẫn do nhà cung cấp sở hữu trừ khi bạn đặt rõ một mức suy nghĩ.
  - Anthropic Claude Opus 4.7 ánh xạ `/think xhigh` tới suy nghĩ thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là một chỉ thị suy nghĩ và `xhigh` là thiết lập effort của Opus 4.7.
  - Anthropic Claude Opus 4.7 cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn effort tối đa do nhà cung cấp sở hữu.
  - Các model Direct DeepSeek V4 cung cấp `/think xhigh|max`; cả hai ánh xạ tới DeepSeek `reasoning_effort: "max"` trong khi các mức không phải `off` thấp hơn ánh xạ tới `high`.
  - Các model DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning_effort` được OpenRouter hỗ trợ. Các ghi đè `max` đã lưu quay về `xhigh`.
  - Các model Ollama có khả năng suy nghĩ cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi effort `low`, `medium`, và `high`.
  - Các model OpenAI GPT ánh xạ `/think` thông qua hỗ trợ effort Responses API theo từng model. `/think off` chỉ gửi `reasoning.effort: "none"` khi model đích hỗ trợ; nếu không, OpenClaw bỏ qua payload reasoning bị tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tương thích OpenAI tùy chỉnh có thể chọn hỗ trợ `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` để bao gồm `"xhigh"`. Cơ chế này dùng cùng metadata compat ánh xạ payload effort reasoning OpenAI gửi đi, nên menu, xác thực phiên, CLI tác tử, và `llm-task` khớp với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình nhưng lỗi thời sẽ bỏ qua việc chèn reasoning qua proxy vì tuyến đã ngừng hoạt động đó có thể trả văn bản câu trả lời cuối cùng qua các trường reasoning.
  - Google Gemini ánh xạ `/think adaptive` tới suy nghĩ động do nhà cung cấp Gemini sở hữu. Yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, trong khi yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ model đó.
  - MiniMax (`minimax/*`) trên đường dẫn streaming tương thích Anthropic mặc định dùng `thinking: { type: "disabled" }` trừ khi bạn đặt suy nghĩ rõ ràng trong tham số model hoặc tham số yêu cầu. Điều này tránh rò rỉ delta `reasoning_content` từ định dạng stream Anthropic không gốc của MiniMax.
  - Z.AI (`zai/*`) chỉ hỗ trợ suy nghĩ nhị phân (`on`/`off`). Bất kỳ mức nào không phải `off` đều được xem là `on` (ánh xạ tới `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` tới `thinking: { type: "disabled" }` và bất kỳ mức nào không phải `off` tới `thinking: { type: "enabled" }`. Khi bật suy nghĩ, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi một tin nhắn chỉ gồm chỉ thị).
3. Mặc định theo tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các model có khả năng reasoning phân giải thành `medium` hoặc mức không phải `off` gần nhất được hỗ trợ cho model đó, còn các model không reasoning giữ nguyên `off`.

## Thiết lập mặc định phiên

- Gửi một tin nhắn **chỉ** gồm chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó được giữ cho phiên hiện tại (mặc định theo từng người gửi); bị xóa bởi `/think:off` hoặc khi phiên được đặt lại do không hoạt động.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên không đổi.
- Gửi `/think` (hoặc `/think:`) không có đối số để xem mức suy nghĩ hiện tại.

## Áp dụng theo tác tử

- **Pi nhúng**: mức đã phân giải được truyền tới runtime tác tử Pi trong tiến trình.
- **Backend CLI Claude**: các mức không phải off được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; xem [Backend CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Mức: `on|off`.
- Tin nhắn chỉ gồm chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và phản hồi `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Nội tuyến/chỉ gồm chỉ thị `/fast on|off`
  2. Ghi đè phiên
  3. Mặc định theo tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với `openai-codex/*`, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. OpenClaw giữ một công tắc `/fast` dùng chung trên cả hai đường dẫn xác thực.
- Với các yêu cầu `anthropic/*` công khai trực tiếp, bao gồm lưu lượng đã xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số model Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai cùng được đặt. OpenClaw vẫn bỏ qua việc chèn tầng dịch vụ Anthropic cho các URL cơ sở proxy không phải Anthropic.
- `/status` chỉ hiển thị `Fast` khi chế độ nhanh được bật.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ gồm chỉ thị bật/tắt verbose của phiên và phản hồi `Verbose logging enabled.` / `Verbose logging disabled.`; mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên rõ ràng; xóa nó qua UI Sessions bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không có đối số để xem mức verbose hiện tại.
- Khi bật verbose, các tác tử phát ra kết quả công cụ có cấu trúc (Pi, các tác tử JSON khác) gửi từng lệnh gọi công cụ trở lại dưới dạng tin nhắn riêng chỉ có metadata, có tiền tố `<emoji> <tool-name>: <arg>` khi có. Các tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (các bong bóng riêng), không phải dưới dạng delta streaming.
- Tóm tắt lỗi công cụ vẫn hiển thị trong chế độ bình thường, nhưng hậu tố chi tiết lỗi thô bị ẩn trừ khi verbose là `on` hoặc `full`.
- Khi verbose là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn tới độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo thiết lập mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình dạng của tóm tắt công cụ `/verbose` và các dòng công cụ bản nháp tiến trình. Dùng `"explain"` (mặc định) cho các nhãn ngắn gọn dễ đọc như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn lệnh/chi tiết thô được nối thêm để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng tác tử ghi đè mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ gồm chỉ thị bật/tắt đầu ra truy vết Plugin của phiên và phản hồi `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không có đối số để xem mức truy vết hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu, chẳng hạn như tóm tắt gỡ lỗi Active Memory.
- Các dòng truy vết có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.

## Khả năng hiển thị reasoning (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ gồm chỉ thị bật/tắt việc hiển thị các khối suy nghĩ trong phản hồi.
- Khi bật, reasoning được gửi dưới dạng **tin nhắn riêng** có tiền tố `Reasoning:`.
- `stream` (chỉ Telegram): stream reasoning vào bong bóng nháp Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng không kèm reasoning.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có đối số để xem mức reasoning hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, sau đó ghi đè phiên, sau đó mặc định theo tác tử (`agents.list[].reasoningDefault`), rồi dự phòng (`off`).

Các thẻ reasoning model cục bộ bị sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trong phản hồi bình thường, và reasoning chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bọc toàn bộ trong một thẻ mở chưa đóng duy nhất và nếu không sẽ được gửi dưới dạng văn bản rỗng, OpenClaw loại bỏ thẻ mở sai định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng cao nằm trong [Chế độ nâng cao](/vi/tools/elevated).

## Heartbeat

- Nội dung dò Heartbeat là lời nhắc heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Chỉ thị nội tuyến trong tin nhắn heartbeat áp dụng như thường lệ (nhưng tránh thay đổi mặc định phiên từ heartbeat).
- Việc gửi Heartbeat mặc định chỉ gửi payload cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng tác tử.

## UI chat web

- Bộ chọn suy nghĩ của chat web phản chiếu mức đã lưu của phiên từ kho phiên gửi đến/cấu hình khi trang tải.
- Chọn một mức khác sẽ ghi đè phiên ngay lập tức qua `sessions.patch`; nó không chờ lần gửi tiếp theo và không phải là ghi đè một lần `thinkingOnce`.
- Tùy chọn đầu tiên luôn là `Default (<resolved level>)`, trong đó mặc định đã phân giải đến từ hồ sơ suy nghĩ của nhà cung cấp cho model phiên đang hoạt động cộng với cùng logic dự phòng mà `/status` và `session_status` dùng.
- Bộ chọn dùng `thinkingLevels` do hàng phiên Gateway/mặc định trả về, với `thinkingOptions` được giữ làm danh sách nhãn kế thừa. UI trình duyệt không giữ danh sách regex nhà cung cấp riêng; Plugin sở hữu các tập mức theo từng model.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nên chỉ thị chat và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các Plugin nhà cung cấp có thể expose `resolveThinkingProfile(ctx)` để xác định các mức được hỗ trợ và mức mặc định của mô hình.
- Các Plugin nhà cung cấp proxy mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục proxy luôn đồng bộ.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu trữ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm `label` hiển thị. Các nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Các Plugin công cụ cần xác thực một ghi đè suy luận rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên giữ danh sách mức theo nhà cung cấp/mô hình riêng.
- Các Plugin công cụ có quyền truy cập vào siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các tùy chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía Plugin.
- Các hook cũ đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn là adapter tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Các hàng/giá trị mặc định của Gateway expose `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các máy khách ACP/chat kết xuất cùng các id và nhãn hồ sơ mà xác thực runtime sử dụng.
