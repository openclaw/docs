---
read_when:
    - Điều chỉnh việc phân tích cú pháp hoặc các giá trị mặc định cho suy luận, chế độ nhanh hoặc chỉ thị chi tiết
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và mức hiển thị lập luận
title: Mức độ suy nghĩ
x-i18n:
    generated_at: "2026-05-05T01:51:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong bất kỳ nội dung gửi vào nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (ngân sách tối đa)
  - xhigh → “ultrathink+” (các mô hình GPT-5.2+ và Codex, cộng với mức effort của Anthropic Claude Opus 4.7)
  - adaptive → suy luận thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7, và suy luận động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7; Ollama ánh xạ mức này tới effort `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn suy luận được điều khiển bởi hồ sơ nhà cung cấp. Plugin của nhà cung cấp khai báo tập mức chính xác cho mô hình đã chọn, bao gồm các nhãn như `on` dạng nhị phân.
  - `adaptive`, `xhigh`, và `max` chỉ được quảng bá cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Chỉ thị nhập cho các mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` lùi về `medium` trên các mô hình không thích ứng, còn `xhigh` và `max` lùi về mức khác `off` lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định dùng `adaptive` khi không đặt mức suy luận rõ ràng.
  - Anthropic Claude Opus 4.7 không mặc định dùng suy luận thích ứng. Mặc định effort API của nó vẫn do nhà cung cấp sở hữu trừ khi bạn đặt rõ một mức suy luận.
  - Anthropic Claude Opus 4.7 ánh xạ `/think xhigh` tới suy luận thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị suy luận và `xhigh` là thiết lập effort của Opus 4.7.
  - Anthropic Claude Opus 4.7 cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn effort tối đa do nhà cung cấp sở hữu.
  - Các mô hình DeepSeek V4 trực tiếp cung cấp `/think xhigh|max`; cả hai ánh xạ tới `reasoning_effort: "max"` của DeepSeek, trong khi các mức khác `off` thấp hơn ánh xạ tới `high`.
  - Các mô hình DeepSeek V4 định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning_effort` được OpenRouter hỗ trợ. Các ghi đè `max` đã lưu sẽ lùi về `xhigh`.
  - Các mô hình Ollama có khả năng suy luận cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi effort `low`, `medium`, và `high`.
  - Các mô hình GPT của OpenAI ánh xạ `/think` qua hỗ trợ effort theo từng mô hình của Responses API. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận bị tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tương thích OpenAI tùy chỉnh có thể bật `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` bao gồm `"xhigh"`. Cơ chế này dùng cùng metadata tương thích ánh xạ payload effort suy luận OpenAI gửi ra, để menu, xác thực phiên, CLI tác nhân, và `llm-task` thống nhất với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình nhưng lỗi thời sẽ bỏ qua chèn suy luận proxy vì tuyến đã ngừng dùng đó có thể trả văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` tới suy luận động do nhà cung cấp sở hữu của Gemini. Yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, còn yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax (`minimax/*`) trên đường dẫn streaming tương thích Anthropic mặc định dùng `thinking: { type: "disabled" }` trừ khi bạn đặt rõ suy luận trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh rò rỉ các delta `reasoning_content` từ định dạng stream Anthropic không gốc của MiniMax.
  - Z.AI (`zai/*`) chỉ hỗ trợ suy luận nhị phân (`on`/`off`). Mọi mức khác `off` được xem là `on` (ánh xạ tới `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` tới `thinking: { type: "disabled" }` và mọi mức khác `off` tới `thinking: { type: "enabled" }`. Khi suy luận được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi tin nhắn chỉ gồm chỉ thị).
3. Mặc định theo từng tác nhân (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức khác `off` được hỗ trợ gần nhất cho mô hình đó, còn các mô hình không suy luận giữ `off`.

## Đặt mặc định phiên

- Gửi một tin nhắn **chỉ** gồm chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó được giữ cho phiên hiện tại (mặc định theo từng người gửi); được xóa bằng `/think:off` hoặc khi phiên đặt lại do nhàn rỗi.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên không đổi.
- Gửi `/think` (hoặc `/think:`) không kèm đối số để xem mức suy luận hiện tại.

## Áp dụng theo tác nhân

- **Pi nhúng**: mức đã phân giải được truyền tới runtime tác nhân Pi trong tiến trình.
- **Backend Claude CLI**: các mức khác off được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; xem [backend CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Mức: `on|off`.
- Tin nhắn chỉ gồm chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và trả lời `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không kèm chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Nội tuyến/chỉ thị riêng `/fast on|off`
  2. Ghi đè phiên
  3. Mặc định theo từng tác nhân (`agents.list[].fastModeDefault`)
  4. Cấu hình theo từng mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với `openai-codex/*`, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. OpenClaw giữ một công tắc `/fast` dùng chung trên cả hai đường dẫn xác thực.
- Với các yêu cầu `anthropic/*` công khai trực tiếp, bao gồm lưu lượng xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số mô hình Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai được đặt. OpenClaw vẫn bỏ qua chèn tầng dịch vụ Anthropic cho các URL gốc proxy không phải Anthropic.
- `/status` chỉ hiển thị `Fast` khi chế độ nhanh được bật.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ gồm chỉ thị bật/tắt chi tiết cho phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên rõ ràng; xóa qua giao diện Sessions bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, áp dụng mặc định phiên/toàn cục.
- Gửi `/verbose` (hoặc `/verbose:`) không kèm đối số để xem mức chi tiết hiện tại.
- Khi bật chi tiết, các tác nhân phát kết quả công cụ có cấu trúc (Pi, các tác nhân JSON khác) gửi từng lệnh gọi công cụ trở lại dưới dạng tin nhắn riêng chỉ chứa metadata, có tiền tố `<emoji> <tool-name>: <arg>` khi có. Các tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta streaming.
- Tóm tắt lỗi công cụ vẫn hiển thị ở chế độ thường, nhưng hậu tố chi tiết lỗi thô bị ẩn trừ khi chi tiết là `on` hoặc `full`.
- Khi chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn tới độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo thiết lập mới.
- `agents.defaults.toolProgressDetail` điều khiển hình dạng tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến độ. Dùng `"explain"` (mặc định) cho nhãn ngắn gọn dành cho người dùng như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng tác nhân ghi đè mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ gồm chỉ thị bật/tắt đầu ra truy vết Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng tới tin nhắn đó; nếu không, áp dụng mặc định phiên/toàn cục.
- Gửi `/trace` (hoặc `/trace:`) không kèm đối số để xem mức truy vết hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu, chẳng hạn tóm tắt gỡ lỗi Active Memory.
- Các dòng truy vết có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý thông thường.

## Hiển thị suy luận (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ gồm chỉ thị bật/tắt việc hiển thị các khối suy luận trong phản hồi.
- Khi bật, suy luận được gửi dưới dạng **tin nhắn riêng** có tiền tố `Reasoning:`.
- `stream` (chỉ Telegram): stream suy luận vào bong bóng nháp Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng không kèm suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không kèm đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo từng tác nhân (`agents.list[].reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận của mô hình cục bộ bị sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trong phản hồi thông thường, và phần suy luận chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bọc hoàn toàn trong một thẻ mở chưa đóng duy nhất và nếu không sẽ gửi dưới dạng văn bản trống, OpenClaw xóa thẻ mở sai định dạng đó và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng quyền nằm trong [Chế độ nâng quyền](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là prompt heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong tin nhắn heartbeat áp dụng như bình thường (nhưng tránh thay đổi mặc định phiên từ heartbeat).
- Việc gửi Heartbeat mặc định chỉ gửi payload cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng tác nhân.

## Giao diện trò chuyện web

- Bộ chọn suy luận của trò chuyện web phản chiếu mức đã lưu của phiên từ kho phiên/cấu hình gửi vào khi trang tải.
- Chọn mức khác sẽ ghi ghi đè phiên ngay lập tức qua `sessions.patch`; nó không chờ lần gửi tiếp theo và không phải là ghi đè `thinkingOnce` dùng một lần.
- Tùy chọn đầu tiên luôn là `Default (<resolved level>)`, trong đó mặc định đã phân giải đến từ hồ sơ suy luận của nhà cung cấp cho mô hình phiên đang hoạt động cộng với cùng logic dự phòng mà `/status` và `session_status` dùng.
- Bộ chọn dùng `thinkingLevels` do hàng phiên Gateway/mặc định trả về, với `thinkingOptions` được giữ làm danh sách nhãn kế thừa. Giao diện trình duyệt không giữ danh sách regex nhà cung cấp riêng; Plugin sở hữu các tập mức theo từng mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nên chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các plugin nhà cung cấp có thể cung cấp `resolveThinkingProfile(ctx)` để xác định các mức được mô hình hỗ trợ và mức mặc định.
- Các plugin nhà cung cấp proxy mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để các catalog Anthropic trực tiếp và proxy luôn đồng bộ.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu trữ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm một `label` hiển thị. Các nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Các plugin công cụ cần xác thực một ghi đè suy luận rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên tự duy trì danh sách mức nhà cung cấp/mô hình riêng.
- Các plugin công cụ có quyền truy cập vào siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các lựa chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía plugin.
- Các hook cũ đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn được giữ làm bộ chuyển đổi tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Các hàng/mặc định của Gateway hiển thị `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các client ACP/chat hiển thị cùng các id hồ sơ và nhãn mà quá trình xác thực runtime sử dụng.
