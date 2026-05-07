---
read_when:
    - Điều chỉnh phân tích cú pháp hoặc giá trị mặc định cho các chỉ thị tư duy, chế độ nhanh hoặc chi tiết
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị phần lập luận
title: Mức độ suy nghĩ
x-i18n:
    generated_at: "2026-05-07T13:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
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
  - xhigh → "ultrathink+" (các mô hình GPT-5.2+ và Codex, cộng với mức nỗ lực Anthropic Claude Opus 4.7)
  - adaptive → suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7, và suy nghĩ động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7; Ollama ánh xạ mức này sang nỗ lực `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn suy nghĩ được điều khiển bởi hồ sơ nhà cung cấp. Các Plugin nhà cung cấp khai báo chính xác tập mức cho mô hình đã chọn, bao gồm các nhãn như nhị phân `on`.
  - `adaptive`, `xhigh`, và `max` chỉ được hiển thị cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Các chỉ thị đã nhập cho mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` quay về `medium` trên các mô hình không thích ứng, trong khi `xhigh` và `max` quay về mức không phải `off` lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi không đặt mức suy nghĩ rõ ràng.
  - Anthropic Claude Opus 4.7 không mặc định dùng suy nghĩ thích ứng. Mặc định nỗ lực API của nó vẫn do nhà cung cấp sở hữu trừ khi bạn đặt rõ một mức suy nghĩ.
  - Anthropic Claude Opus 4.7 ánh xạ `/think xhigh` sang suy nghĩ thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị suy nghĩ và `xhigh` là cài đặt nỗ lực của Opus 4.7.
  - Anthropic Claude Opus 4.7 cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn nỗ lực tối đa do nhà cung cấp sở hữu.
  - Các mô hình DeepSeek V4 trực tiếp cung cấp `/think xhigh|max`; cả hai đều ánh xạ tới DeepSeek `reasoning_effort: "max"` trong khi các mức thấp hơn không phải `off` ánh xạ tới `high`.
  - Các mô hình DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning_effort` được OpenRouter hỗ trợ. Các ghi đè `max` đã lưu quay về `xhigh`.
  - Các mô hình Ollama có khả năng suy nghĩ cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi nỗ lực `low`, `medium`, và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua hỗ trợ nỗ lực Responses API theo từng mô hình. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình mục tiêu hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận bị tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tương thích OpenAI tùy chỉnh có thể bật `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` bao gồm `"xhigh"`. Cơ chế này dùng cùng siêu dữ liệu tương thích ánh xạ payload nỗ lực suy luận OpenAI gửi đi, nên menu, xác thực phiên, CLI agent, và `llm-task` thống nhất với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình cũ bỏ qua việc chèn suy luận proxy vì tuyến đã ngừng đó có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` tới suy nghĩ động do nhà cung cấp Gemini sở hữu. Yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, trong khi yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax (`minimax/*`) trên đường dẫn streaming tương thích Anthropic mặc định là `thinking: { type: "disabled" }` trừ khi bạn đặt rõ suy nghĩ trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh rò rỉ delta `reasoning_content` từ định dạng stream Anthropic không gốc của MiniMax.
  - Z.AI (`zai/*`) chỉ hỗ trợ suy nghĩ nhị phân (`on`/`off`). Bất kỳ mức nào không phải `off` đều được coi là `on` (ánh xạ tới `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` tới `thinking: { type: "disabled" }` và bất kỳ mức nào không phải `off` tới `thinking: { type: "enabled" }`. Khi suy nghĩ được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi một tin nhắn chỉ có chỉ thị).
3. Mặc định theo từng agent (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` được hỗ trợ gần nhất cho mô hình đó, còn các mô hình không suy luận vẫn là `off`.

## Đặt mặc định phiên

- Gửi một tin nhắn **chỉ** gồm chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Cài đặt đó giữ nguyên cho phiên hiện tại (mặc định theo từng người gửi); được xóa bằng `/think:off` hoặc đặt lại khi phiên nhàn rỗi.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên giữ nguyên.
- Gửi `/think` (hoặc `/think:`) không kèm đối số để xem mức suy nghĩ hiện tại.

## Áp dụng theo agent

- **Pi nhúng**: mức đã phân giải được truyền vào runtime agent Pi trong tiến trình.
- **backend Claude CLI**: các mức không phải off được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; xem [backend CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Mức: `on|off`.
- Tin nhắn chỉ có chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và trả lời `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không kèm chế độ để xem trạng thái chế độ nhanh hiệu dụng hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Nội tuyến/chỉ thị riêng `/fast on|off`
  2. Ghi đè phiên
  3. Mặc định theo từng agent (`agents.list[].fastModeDefault`)
  4. Cấu hình theo từng mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với `openai-codex/*`, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. OpenClaw giữ một công tắc `/fast` dùng chung cho cả hai đường dẫn xác thực.
- Với các yêu cầu công khai trực tiếp `anthropic/*`, bao gồm lưu lượng được xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số mô hình Anthropic rõ ràng `serviceTier` / `service_tier` ghi đè mặc định chế độ nhanh khi cả hai được đặt. OpenClaw vẫn bỏ qua chèn tầng dịch vụ Anthropic cho các URL cơ sở proxy không phải Anthropic.
- `/status` chỉ hiển thị `Fast` khi chế độ nhanh được bật.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt chi tiết phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên rõ ràng; xóa nó qua giao diện người dùng Sessions bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, mặc định phiên/toàn cục được áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không kèm đối số để xem mức chi tiết hiện tại.
- Khi chế độ chi tiết bật, các agent phát ra kết quả công cụ có cấu trúc (Pi, các agent JSON khác) gửi lại từng lệnh gọi công cụ dưới dạng tin nhắn chỉ có siêu dữ liệu riêng, có tiền tố `<emoji> <tool-name>: <arg>` khi có. Các tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta streaming.
- Tóm tắt lỗi công cụ vẫn hiển thị trong chế độ thường, nhưng các hậu tố chi tiết lỗi thô bị ẩn trừ khi chi tiết là `on` hoặc `full`.
- Khi chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn đến độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo cài đặt mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình dạng của tóm tắt công cụ `/verbose` và các dòng công cụ bản nháp tiến độ. Dùng `"explain"` (mặc định) cho nhãn ngắn gọn dễ đọc như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn nối thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng agent ghi đè mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt đầu ra truy vết Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, mặc định phiên/toàn cục được áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không kèm đối số để xem mức truy vết hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu, chẳng hạn như tóm tắt gỡ lỗi Active Memory.
- Dòng truy vết có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý thông thường.

## Hiển thị suy luận (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ có chỉ thị bật/tắt việc hiển thị các khối suy nghĩ trong phản hồi.
- Khi được bật, suy luận được gửi dưới dạng **tin nhắn riêng** có tiền tố `Reasoning:`.
- `stream` (chỉ Telegram): stream suy luận vào bong bóng bản nháp Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng không kèm suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không kèm đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo từng agent (`agents.list[].reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận mô hình cục bộ sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trên phản hồi thông thường, và suy luận chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bọc hoàn toàn trong một thẻ mở chưa đóng duy nhất và nếu không sẽ được gửi dưới dạng văn bản rỗng, OpenClaw xóa thẻ mở sai định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng cao nằm trong [Chế độ nâng cao](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là lời nhắc Heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Chỉ thị nội tuyến trong tin nhắn Heartbeat áp dụng như thường lệ (nhưng tránh thay đổi mặc định phiên từ Heartbeat).
- Việc gửi Heartbeat mặc định chỉ gửi payload cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng agent.

## Giao diện web chat UI

- Bộ chọn thinking trong trò chuyện web phản ánh mức đã lưu của phiên từ kho/cấu hình phiên gửi đến khi trang tải.
- Chọn một mức khác sẽ ghi phần ghi đè của phiên ngay lập tức qua `sessions.patch`; thao tác này không chờ lần gửi tiếp theo và không phải là phần ghi đè `thinkingOnce` dùng một lần.
- Tùy chọn đầu tiên luôn là lựa chọn xóa phần ghi đè. Nó hiển thị `Được kế thừa: <resolved level>` khi phiên đang kế thừa một mặc định hiệu lực không tắt, hoặc `Tắt` khi thinking được kế thừa bị vô hiệu hóa.
- Các lựa chọn rõ ràng trong bộ chọn được gắn nhãn là phần ghi đè, đồng thời giữ nguyên nhãn của nhà cung cấp khi có (ví dụ `Ghi đè: maximum` cho tùy chọn `max` được nhà cung cấp gắn nhãn).
- Bộ chọn sử dụng `thinkingLevels` do hàng/mặc định phiên của Gateway trả về, còn `thinkingOptions` được giữ làm danh sách nhãn kế thừa. UI trình duyệt không giữ danh sách regex nhà cung cấp riêng; plugins sở hữu các tập mức dành riêng cho mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, để chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Provider plugins có thể cung cấp `resolveThinkingProfile(ctx)` để định nghĩa các mức được mô hình hỗ trợ và mặc định.
- Provider plugins proxy các mô hình Claude nên dùng lại `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục proxy luôn thống nhất.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm `label` hiển thị. Nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Tool plugins cần xác thực một phần ghi đè thinking rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên giữ danh sách mức nhà cung cấp/mô hình riêng.
- Tool plugins có quyền truy cập metadata mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các opt-in `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía plugin.
- Các hook kế thừa đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn là bộ điều hợp tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Hàng/mặc định của Gateway cung cấp `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các máy khách ACP/trò chuyện hiển thị cùng id và nhãn hồ sơ mà xác thực runtime sử dụng.
