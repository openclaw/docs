---
read_when:
    - Điều chỉnh phân tích chỉ thị tư duy, chế độ nhanh, hoặc verbose hay các mặc định
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị lập luận
title: Mức độ suy luận
x-i18n:
    generated_at: "2026-07-03T09:46:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong bất kỳ nội dung đến nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (ngân sách tối đa)
  - xhigh → "ultrathink+" (GPT-5.2+ và các mô hình Codex, cùng mức effort của Anthropic Claude Opus 4.7+)
  - adaptive → chế độ suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7+, và Google Gemini dynamic thinking)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7+; Ollama ánh xạ mức này tới effort `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn thinking được điều khiển bởi hồ sơ nhà cung cấp. Plugin nhà cung cấp khai báo chính xác tập mức cho mô hình đã chọn, bao gồm các nhãn như nhị phân `on`.
  - `adaptive`, `xhigh`, và `max` chỉ được quảng bá cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Chỉ thị được nhập cho các mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` lùi về `medium` trên các mô hình không thích ứng, trong khi `xhigh` và `max` lùi về mức không phải off lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi chưa đặt rõ mức thinking.
  - Anthropic Claude Opus 4.8 và Opus 4.7 giữ thinking tắt trừ khi bạn đặt rõ một mức thinking. Mặc định effort do nhà cung cấp sở hữu của Opus 4.8 là `high` sau khi bật adaptive thinking.
  - Anthropic Claude Opus 4.7+ ánh xạ `/think xhigh` tới adaptive thinking cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị thinking và `xhigh` là thiết lập effort của Opus.
  - Anthropic Claude Opus 4.7+ cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn effort tối đa do nhà cung cấp sở hữu.
  - Các mô hình Direct DeepSeek V4 cung cấp `/think xhigh|max`; cả hai đều ánh xạ tới DeepSeek `reasoning_effort: "max"` trong khi các mức thấp hơn không phải off ánh xạ tới `high`.
  - Các mô hình DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning.effort` được OpenRouter hỗ trợ thay vì `reasoning_effort` cấp cao nhất gốc của DeepSeek. Các mức thấp hơn không phải off ánh xạ tới `high`, và các ghi đè `max` đã lưu lùi về `xhigh`.
  - Các mô hình Ollama có khả năng thinking cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi effort `low`, `medium`, và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua hỗ trợ effort của Responses API dành riêng cho mô hình. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận đã tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tùy chỉnh tương thích OpenAI có thể chọn tham gia `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` bao gồm `"xhigh"`. Điều này dùng cùng metadata compat dùng để ánh xạ payload effort suy luận OpenAI gửi đi, nên menu, xác thực phiên, CLI tác tử, và `llm-task` thống nhất với hành vi vận chuyển.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình lỗi thời bỏ qua việc chèn suy luận proxy vì tuyến đã ngừng đó có thể trả về văn bản câu trả lời cuối cùng qua các trường reasoning.
  - Google Gemini ánh xạ `/think adaptive` tới dynamic thinking do nhà cung cấp sở hữu của Gemini. Các yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, trong khi các yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) trên đường dẫn phát trực tuyến tương thích Anthropic mặc định là `thinking: { type: "disabled" }` trừ khi bạn đặt rõ thinking trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh rò rỉ các delta `reasoning_content` từ định dạng luồng Anthropic không gốc của M2.x. MiniMax-M3 (và M3.x) được miễn trừ: M3 phát ra các khối thinking Anthropic đúng chuẩn và trả về nội dung rỗng khi thinking bị tắt, nên OpenClaw giữ M3 trên đường dẫn thinking bị bỏ qua/thích ứng của nhà cung cấp.
  - Z.AI (`zai/*`) là nhị phân (`on`/`off`) cho hầu hết mô hình GLM. GLM-5.2 là ngoại lệ: nó cung cấp `/think off|low|high|max`, ánh xạ `low` và `high` tới Z.AI `reasoning_effort: "high"`, và ánh xạ `max` tới `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) luôn suy nghĩ. Hồ sơ của nó chỉ cung cấp `on`, và OpenClaw bỏ qua trường `thinking` gửi đi theo yêu cầu của Moonshot. Các mô hình `moonshot/*` khác ánh xạ `/think off` tới `thinking: { type: "disabled" }` và mọi mức không phải `off` tới `thinking: { type: "enabled" }`. Khi thinking được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi một tin nhắn chỉ có chỉ thị).
3. Mặc định theo từng tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` gần nhất được hỗ trợ cho mô hình đó, và các mô hình không suy luận vẫn là `off`.

## Đặt mặc định phiên

- Gửi một tin nhắn **chỉ** chứa chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó giữ nguyên cho phiên hiện tại (mặc định theo từng người gửi). Dùng `/think default` để xóa ghi đè phiên và kế thừa mặc định đã cấu hình/nhà cung cấp; các bí danh bao gồm `inherit`, `clear`, `reset`, và `unpin`.
- `/think off` lưu một ghi đè tắt rõ ràng. Nó tắt thinking cho đến khi bạn thay đổi hoặc xóa ghi đè phiên.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên không đổi.
- Gửi `/think` (hoặc `/think:`) không có đối số để xem mức thinking hiện tại.

## Áp dụng theo tác tử

- **OpenClaw nhúng**: mức đã phân giải được truyền tới runtime tác tử OpenClaw trong tiến trình.
- **Backend Claude CLI**: các mức không phải off được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; xem [backend CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Mức: `auto|on|off|default`.
- Tin nhắn chỉ có chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và trả lời `Fast mode set to auto.`, `Fast mode enabled.`, hoặc `Fast mode disabled.`. Dùng `/fast default` để xóa ghi đè phiên và kế thừa mặc định đã cấu hình; các bí danh bao gồm `inherit`, `clear`, `reset`, và `unpin`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Ghi đè `/fast auto|on|off` nội tuyến/chỉ-thị-duy-nhất (`/fast default` xóa lớp này)
  2. Ghi đè phiên
  3. Mặc định theo từng tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo từng mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- `auto` giữ chế độ phiên/cấu hình là auto nhưng phân giải độc lập từng lệnh gọi mô hình mới. Các lệnh gọi bắt đầu trước ngưỡng cắt auto có chế độ nhanh được bật; các lệnh gọi thử lại, dự phòng, kết quả công cụ, hoặc tiếp diễn sau đó bắt đầu với chế độ nhanh bị tắt. Ngưỡng cắt mặc định là 60 giây; đặt `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với các mô hình `openai/*` / `openai-codex/*` dựa trên Codex, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. Các lượt app-server Codex gốc chỉ nhận tier trên `turn/start` hoặc khi bắt đầu/tiếp tục luồng, nên `auto` không thể đổi tier một lượt app-server đang chạy; nó áp dụng cho lượt mô hình tiếp theo mà OpenClaw bắt đầu.
- Với các yêu cầu `anthropic/*` công khai trực tiếp, bao gồm lưu lượng được xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số mô hình Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai cùng được đặt. OpenClaw vẫn bỏ qua việc chèn tầng dịch vụ Anthropic cho URL cơ sở proxy không phải Anthropic.
- `/status` hiển thị `Fast` khi chế độ nhanh được bật và `Fast:auto` khi chế độ đã cấu hình là auto.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt verbose của phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; các mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên tắt rõ ràng; xóa nó qua UI Sessions bằng cách chọn `inherit`.
- Người gửi kênh bên ngoài được ủy quyền có thể lưu bền ghi đè verbose của phiên. Máy khách gateway/webchat nội bộ cần `operator.admin` để lưu bền.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không có đối số để xem mức verbose hiện tại.
- Khi bật verbose, các tác tử phát ra kết quả công cụ có cấu trúc sẽ gửi lại từng lệnh gọi công cụ dưới dạng tin nhắn chỉ metadata riêng, với tiền tố `<emoji> <tool-name>: <arg>` khi có. Các tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta phát trực tuyến.
- Tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng hậu tố chi tiết lỗi thô bị ẩn trừ khi verbose là `full`.
- Khi verbose là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn tới độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo thiết lập mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình dạng của tóm tắt công cụ `/verbose` và các dòng công cụ bản nháp tiến độ. Dùng `"explain"` (mặc định) cho các nhãn ngắn gọn thân thiện với người đọc như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn nối thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng tác tử ghi đè mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt đầu ra truy vết Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không có đối số để xem mức truy vết hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu, chẳng hạn các tóm tắt gỡ lỗi Active Memory.
- Các dòng truy vết có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.

## Khả năng hiển thị suy luận (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ có chỉ thị bật/tắt việc hiển thị các khối thinking trong phản hồi.
- Khi được bật, suy luận được gửi dưới dạng **tin nhắn riêng** có tiền tố `Thinking`.
- `stream`: phát trực tuyến suy luận trong khi phản hồi đang được tạo khi kênh đang hoạt động hỗ trợ xem trước suy luận, rồi gửi câu trả lời cuối cùng không kèm suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo từng tác tử (`agents.list[].reasoningDefault`), rồi mặc định toàn cục (`agents.defaults.reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận của mô hình cục bộ bị sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn được ẩn trong phản hồi thông thường, và phần suy luận chưa đóng sau phần văn bản đã hiển thị cũng được ẩn. Nếu một phản hồi được bọc hoàn toàn trong một thẻ mở chưa đóng duy nhất và nếu không sẽ được gửi dưới dạng văn bản rỗng, OpenClaw sẽ xóa thẻ mở sai định dạng đó và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu về chế độ nâng quyền nằm trong [Chế độ nâng quyền](/vi/tools/elevated).

## Heartbeat

- Nội dung đầu dò Heartbeat là lời nhắc Heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong thông điệp Heartbeat áp dụng như bình thường (nhưng tránh thay đổi mặc định phiên từ Heartbeat).
- Việc gửi Heartbeat mặc định chỉ gửi tải trọng cuối cùng. Để cũng gửi thông điệp `Thinking` riêng biệt (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng tác tử.

## Giao diện trò chuyện web

- Bộ chọn suy luận của trò chuyện web phản chiếu mức đã lưu của phiên từ kho/cấu hình phiên đầu vào khi trang tải.
- Chọn một mức khác sẽ ghi phần ghi đè phiên ngay lập tức qua `sessions.patch`; nó không chờ lần gửi tiếp theo và không phải là ghi đè một lần `thinkingOnce`.
- Tùy chọn đầu tiên luôn là lựa chọn xóa ghi đè. Nó hiển thị `Inherited: <resolved level>`, bao gồm `Inherited: Off` khi suy luận kế thừa bị tắt.
- Các lựa chọn rõ ràng trong bộ chọn dùng nhãn mức trực tiếp của chúng trong khi vẫn giữ nhãn nhà cung cấp khi có (ví dụ `Maximum` cho tùy chọn `max` do nhà cung cấp gắn nhãn).
- Bộ chọn dùng `thinkingLevels` do hàng phiên/mặc định của Gateway trả về, với `thinkingOptions` được giữ làm danh sách nhãn kế thừa. Giao diện người dùng trình duyệt không giữ danh sách regex nhà cung cấp riêng; các Plugin sở hữu tập mức theo từng mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, vì vậy các chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các Plugin nhà cung cấp có thể hiển thị `resolveThinkingProfile(ctx)` để xác định các mức được mô hình hỗ trợ và mức mặc định.
- Các Plugin nhà cung cấp ủy quyền mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục ủy quyền luôn khớp nhau.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm một `label` hiển thị. Nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Các hook hồ sơ nhận các dữ kiện danh mục đã hợp nhất khi có, bao gồm `reasoning`, `compat.thinkingFormat`, và `compat.supportedReasoningEfforts`. Dùng các dữ kiện đó để chỉ hiển thị hồ sơ nhị phân hoặc tùy chỉnh khi hợp đồng yêu cầu đã cấu hình hỗ trợ tải trọng tương ứng.
- Các Plugin công cụ cần xác thực một ghi đè suy luận rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên giữ danh sách mức nhà cung cấp/mô hình riêng.
- Các Plugin công cụ có quyền truy cập vào siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các lựa chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía Plugin.
- Các hook kế thừa đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn tồn tại dưới dạng bộ chuyển đổi tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Các hàng/mặc định của Gateway hiển thị `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các máy khách ACP/trò chuyện kết xuất cùng id và nhãn hồ sơ mà xác thực runtime sử dụng.
