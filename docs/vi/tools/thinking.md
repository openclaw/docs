---
read_when:
    - Điều chỉnh việc phân tích cú pháp hoặc giá trị mặc định cho chỉ thị thinking, fast-mode hoặc verbose
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị suy luận
title: Mức độ suy nghĩ
x-i18n:
    generated_at: "2026-04-29T23:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong bất kỳ nội dung đến nào: `/t <level>`, `/think:<level>`, hoặc `/thinking <level>`.
- Các mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (ngân sách tối đa)
  - xhigh → “ultrathink+” (các mô hình GPT-5.2+ và Codex, cộng với nỗ lực Anthropic Claude Opus 4.7)
  - adaptive → suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7, và suy nghĩ động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7; Ollama ánh xạ mức này tới nỗ lực `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Các menu và bộ chọn suy nghĩ được điều khiển bởi hồ sơ nhà cung cấp. Plugin nhà cung cấp khai báo chính xác tập mức cho mô hình được chọn, bao gồm các nhãn như `on` nhị phân.
  - `adaptive`, `xhigh`, và `max` chỉ được quảng bá cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Các chỉ thị đã nhập cho mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` rơi về `medium` trên các mô hình không thích ứng, còn `xhigh` và `max` rơi về mức không phải `off` lớn nhất được hỗ trợ cho mô hình được chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi không đặt mức suy nghĩ rõ ràng.
  - Anthropic Claude Opus 4.7 không mặc định dùng suy nghĩ thích ứng. Mặc định nỗ lực API của nó vẫn do nhà cung cấp sở hữu trừ khi bạn đặt rõ một mức suy nghĩ.
  - Anthropic Claude Opus 4.7 ánh xạ `/think xhigh` tới suy nghĩ thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị suy nghĩ và `xhigh` là cài đặt nỗ lực của Opus 4.7.
  - Anthropic Claude Opus 4.7 cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn nỗ lực tối đa do nhà cung cấp sở hữu.
  - Các mô hình Ollama có khả năng suy nghĩ cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi nỗ lực `low`, `medium`, và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua hỗ trợ nỗ lực Responses API dành riêng cho từng mô hình. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận bị tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tương thích OpenAI tùy chỉnh có thể chọn tham gia `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` để bao gồm `"xhigh"`. Điều này dùng cùng siêu dữ liệu tương thích ánh xạ payload nỗ lực suy luận OpenAI gửi đi, nên menu, xác thực phiên, CLI tác tử, và `llm-task` thống nhất với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình nhưng cũ sẽ bỏ qua chèn suy luận proxy vì tuyến đã ngừng đó có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` tới suy nghĩ động do nhà cung cấp sở hữu của Gemini. Các yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, còn yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax (`minimax/*`) trên đường dẫn truyền phát tương thích Anthropic mặc định là `thinking: { type: "disabled" }` trừ khi bạn đặt rõ suy nghĩ trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh rò rỉ các delta `reasoning_content` từ định dạng luồng Anthropic không gốc của MiniMax.
  - Z.AI (`zai/*`) chỉ hỗ trợ suy nghĩ nhị phân (`on`/`off`). Bất kỳ mức nào không phải `off` đều được coi là `on` (ánh xạ tới `low`).
  - Moonshot (`moonshot/*`) ánh xạ `/think off` tới `thinking: { type: "disabled" }` và mọi mức không phải `off` tới `thinking: { type: "enabled" }`. Khi suy nghĩ được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi tin nhắn chỉ có chỉ thị).
3. Mặc định theo tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` gần nhất được hỗ trợ cho mô hình đó, và các mô hình không suy luận giữ nguyên `off`.

## Thiết lập mặc định phiên

- Gửi một tin nhắn **chỉ** gồm chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó giữ cho phiên hiện tại (mặc định theo người gửi); được xóa bởi `/think:off` hoặc đặt lại khi phiên nhàn rỗi.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên được giữ nguyên.
- Gửi `/think` (hoặc `/think:`) không có đối số để xem mức suy nghĩ hiện tại.

## Áp dụng theo tác tử

- **Pi nhúng**: mức đã phân giải được truyền tới runtime tác tử Pi trong tiến trình.

## Chế độ nhanh (/fast)

- Các mức: `on|off`.
- Tin nhắn chỉ có chỉ thị bật/tắt ghi đè chế độ nhanh của phiên và trả lời `Fast mode enabled.` / `Fast mode disabled.`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. `/fast on|off` nội tuyến/chỉ thị đơn
  2. Ghi đè phiên
  3. Mặc định theo tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với `openai-codex/*`, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. OpenClaw giữ một công tắc `/fast` dùng chung trên cả hai đường dẫn xác thực.
- Với các yêu cầu công khai trực tiếp `anthropic/*`, bao gồm lưu lượng được xác thực bằng OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các cấp dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Tham số mô hình Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai đều được đặt. OpenClaw vẫn bỏ qua chèn cấp dịch vụ Anthropic cho các URL cơ sở proxy không phải Anthropic.
- `/status` chỉ hiển thị `Fast` khi chế độ nhanh được bật.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Các mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt chi tiết của phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; các mức không hợp lệ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên rõ ràng; xóa nó qua UI Sessions bằng cách chọn `inherit`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không có đối số để xem mức chi tiết hiện tại.
- Khi bật chi tiết, các tác tử phát ra kết quả công cụ có cấu trúc (Pi, các tác tử JSON khác) gửi lại mỗi lệnh gọi công cụ dưới dạng tin nhắn chỉ có siêu dữ liệu riêng, có tiền tố `<emoji> <tool-name>: <arg>` khi có (đường dẫn/lệnh). Các tóm tắt công cụ này được gửi ngay khi mỗi công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta truyền phát.
- Tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng hậu tố chi tiết lỗi thô bị ẩn trừ khi chi tiết là `on` hoặc `full`.
- Khi chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn tới độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lần chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo cài đặt mới.

## Chỉ thị theo dõi Plugin (/trace)

- Các mức: `on` | `off` (mặc định).
- Tin nhắn chỉ có chỉ thị bật/tắt đầu ra theo dõi Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, mặc định phiên/toàn cục sẽ áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không có đối số để xem mức theo dõi hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ phơi bày các dòng theo dõi/gỡ lỗi do Plugin sở hữu, chẳng hạn tóm tắt gỡ lỗi Active Memory.
- Các dòng theo dõi có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.

## Khả năng hiển thị suy luận (/reasoning)

- Các mức: `on|off|stream`.
- Tin nhắn chỉ có chỉ thị bật/tắt việc hiển thị các khối suy nghĩ trong phản hồi.
- Khi được bật, suy luận được gửi dưới dạng **tin nhắn riêng** có tiền tố `Reasoning:`.
- `stream` (chỉ Telegram): truyền phát suy luận vào bong bóng nháp Telegram trong khi phản hồi đang được tạo, sau đó gửi câu trả lời cuối cùng không kèm suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo tác tử (`agents.list[].reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận mô hình cục bộ sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trên phản hồi bình thường, và suy luận chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu phản hồi được bọc hoàn toàn trong một thẻ mở chưa đóng duy nhất và nếu không sẽ gửi dưới dạng văn bản rỗng, OpenClaw xóa thẻ mở sai định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng cao nằm trong [Chế độ nâng cao](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là lời nhắc Heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Chỉ thị nội tuyến trong tin nhắn Heartbeat áp dụng như thường lệ (nhưng tránh thay đổi mặc định phiên từ Heartbeat).
- Gửi Heartbeat mặc định chỉ dùng payload cuối cùng. Để cũng gửi tin nhắn `Reasoning:` riêng (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo tác tử.

## UI trò chuyện web

- Bộ chọn suy nghĩ trong trò chuyện web phản chiếu mức đã lưu của phiên từ kho phiên/cấu hình đầu vào khi trang tải.
- Chọn mức khác sẽ ghi ghi đè phiên ngay lập tức qua `sessions.patch`; nó không chờ lần gửi tiếp theo và không phải ghi đè một lần `thinkingOnce`.
- Tùy chọn đầu tiên luôn là `Default (<resolved level>)`, trong đó mặc định đã phân giải đến từ hồ sơ suy nghĩ của nhà cung cấp cho mô hình phiên đang hoạt động cộng với cùng logic dự phòng mà `/status` và `session_status` dùng.
- Bộ chọn dùng `thinkingLevels` do hàng phiên Gateway/mặc định trả về, với `thinkingOptions` được giữ làm danh sách nhãn kế thừa. UI trình duyệt không giữ danh sách regex nhà cung cấp riêng; Plugin sở hữu các tập mức dành riêng cho mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nên các chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Plugin nhà cung cấp có thể expose `resolveThinkingProfile(ctx)` để xác định các mức được hỗ trợ và giá trị mặc định của mô hình.
- Plugin nhà cung cấp proxy các mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để các catalog Anthropic trực tiếp và proxy luôn đồng bộ.
- Mỗi mức hồ sơ có một `id` chuẩn được lưu trữ (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm `label` hiển thị. Các nhà cung cấp nhị phân sử dụng `{ id: "low", label: "on" }`.
- Plugin công cụ cần xác thực một override suy luận rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên tự duy trì danh sách mức theo nhà cung cấp/mô hình riêng.
- Plugin công cụ có quyền truy cập metadata mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các opt-in `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía Plugin.
- Các hook legacy đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn là adapter tương thích, nhưng các bộ mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Các hàng/giá trị mặc định của Gateway expose `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để các client ACP/chat render cùng các id và label hồ sơ mà xác thực runtime sử dụng.
