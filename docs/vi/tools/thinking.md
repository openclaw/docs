---
read_when:
    - Điều chỉnh phân tích cú pháp hoặc giá trị mặc định cho chỉ thị thinking, fast-mode hoặc verbose
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị phần lập luận
title: Mức độ suy nghĩ
x-i18n:
    generated_at: "2026-06-27T18:19:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
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
  - xhigh → "ultrathink+" (các mô hình GPT-5.2+ và Codex, cộng với effort của Anthropic Claude Opus 4.7+)
  - adaptive → tư duy thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7+, và tư duy động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7+; Ollama ánh xạ mức này tới effort `think` gốc cao nhất của nó)
  - `x-high`, `x_high`, `extra-high`, `extra high`, và `extra_high` ánh xạ tới `xhigh`.
  - `highest` ánh xạ tới `high`.
- Ghi chú về nhà cung cấp:
  - Menu và bộ chọn tư duy được điều khiển bởi hồ sơ nhà cung cấp. Plugin nhà cung cấp khai báo tập mức chính xác cho mô hình đã chọn, bao gồm các nhãn như `on` dạng nhị phân.
  - `adaptive`, `xhigh`, và `max` chỉ được quảng bá cho các hồ sơ nhà cung cấp/mô hình hỗ trợ chúng. Các chỉ thị đã nhập cho mức không được hỗ trợ sẽ bị từ chối kèm các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu hiện có được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` lùi về `medium` trên các mô hình không thích ứng, trong khi `xhigh` và `max` lùi về mức không phải `off` lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định là `adaptive` khi không đặt mức tư duy rõ ràng.
  - Anthropic Claude Opus 4.8 và Opus 4.7 giữ tư duy tắt trừ khi bạn đặt rõ một mức tư duy. Mặc định effort do nhà cung cấp sở hữu của Opus 4.8 là `high` sau khi bật tư duy thích ứng.
  - Anthropic Claude Opus 4.7+ ánh xạ `/think xhigh` tới tư duy thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị tư duy và `xhigh` là cài đặt effort của Opus.
  - Anthropic Claude Opus 4.7+ cũng cung cấp `/think max`; nó ánh xạ tới cùng đường dẫn effort tối đa do nhà cung cấp sở hữu.
  - Các mô hình DeepSeek V4 trực tiếp cung cấp `/think xhigh|max`; cả hai đều ánh xạ tới DeepSeek `reasoning_effort: "max"` trong khi các mức thấp hơn không phải `off` ánh xạ tới `high`.
  - Các mô hình DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning_effort` được OpenRouter hỗ trợ. Các ghi đè `max` đã lưu lùi về `xhigh`.
  - Các mô hình Ollama có khả năng tư duy cung cấp `/think low|medium|high|max`; `max` ánh xạ tới `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi effort `low`, `medium`, và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua hỗ trợ effort theo từng mô hình của Responses API. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình mục tiêu hỗ trợ; nếu không, OpenClaw bỏ qua payload suy luận đã tắt thay vì gửi một giá trị không được hỗ trợ.
  - Các mục danh mục tùy chỉnh tương thích OpenAI có thể chọn tham gia `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` để bao gồm `"xhigh"`. Điều này dùng cùng metadata tương thích ánh xạ payload effort suy luận OpenAI gửi đi, nên menu, xác thực phiên, CLI tác tử, và `llm-task` thống nhất với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã cấu hình nhưng cũ sẽ bỏ qua việc chèn suy luận proxy vì tuyến đã ngừng hoạt động đó có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` tới tư duy động do nhà cung cấp sở hữu của Gemini. Các yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, trong khi các yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ tới `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) trên đường dẫn phát trực tuyến tương thích Anthropic mặc định là `thinking: { type: "disabled" }` trừ khi bạn đặt rõ tư duy trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh rò rỉ các delta `reasoning_content` từ định dạng luồng Anthropic không gốc của M2.x. MiniMax-M3 (và M3.x) được miễn: M3 phát ra các khối tư duy Anthropic đúng chuẩn và trả về nội dung rỗng khi tư duy bị tắt, nên OpenClaw giữ M3 trên đường dẫn tư duy bị bỏ qua/thích ứng của nhà cung cấp.
  - Z.AI (`zai/*`) là nhị phân (`on`/`off`) cho hầu hết các mô hình GLM. GLM-5.2 là ngoại lệ: nó cung cấp `/think off|low|high|max`, ánh xạ `low` và `high` tới Z.AI `reasoning_effort: "high"`, và ánh xạ `max` tới `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) luôn tư duy. Hồ sơ của nó chỉ cung cấp `on`, và OpenClaw bỏ qua trường `thinking` gửi đi theo yêu cầu của Moonshot. Các mô hình `moonshot/*` khác ánh xạ `/think off` tới `thinking: { type: "disabled" }` và mọi mức không phải `off` tới `thinking: { type: "enabled" }`. Khi tư duy được bật, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Ghi đè phiên (được đặt bằng cách gửi một tin nhắn chỉ chứa chỉ thị).
3. Mặc định theo tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: mặc định do nhà cung cấp khai báo khi có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` gần nhất được hỗ trợ cho mô hình đó, và các mô hình không suy luận giữ `off`.

## Đặt mặc định phiên

- Gửi một tin nhắn **chỉ** chứa chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Mức đó được giữ cho phiên hiện tại (mặc định theo người gửi). Dùng `/think default` để xóa ghi đè phiên và kế thừa mặc định đã cấu hình/của nhà cung cấp; các bí danh gồm `inherit`, `clear`, `reset`, và `unpin`.
- `/think off` lưu một ghi đè tắt rõ ràng. Nó tắt tư duy cho đến khi bạn thay đổi hoặc xóa ghi đè phiên.
- Phản hồi xác nhận được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh bị từ chối kèm gợi ý và trạng thái phiên được giữ nguyên.
- Gửi `/think` (hoặc `/think:`) không có đối số để xem mức tư duy hiện tại.

## Áp dụng theo tác tử

- **OpenClaw nhúng**: mức đã phân giải được truyền tới runtime tác tử OpenClaw trong cùng tiến trình.
- **Backend Claude CLI**: các mức không tắt được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; xem [backend CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Mức: `auto|on|off|default`.
- Tin nhắn chỉ chứa chỉ thị bật/tắt một ghi đè chế độ nhanh của phiên và trả lời `Fast mode set to auto.`, `Fast mode enabled.`, hoặc `Fast mode disabled.`. Dùng `/fast default` để xóa ghi đè phiên và kế thừa mặc định đã cấu hình; các bí danh gồm `inherit`, `clear`, `reset`, và `unpin`.
- Gửi `/fast` (hoặc `/fast status`) không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự này:
  1. Ghi đè nội tuyến/chỉ chứa chỉ thị `/fast auto|on|off` (`/fast default` xóa lớp này)
  2. Ghi đè phiên
  3. Mặc định theo tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- `auto` giữ chế độ phiên/cấu hình là tự động nhưng phân giải độc lập từng lệnh gọi mô hình mới. Các lệnh gọi bắt đầu trước ngưỡng tự động sẽ bật chế độ nhanh; các lệnh gọi thử lại, dự phòng, kết quả công cụ, hoặc tiếp tục sau đó bắt đầu với chế độ nhanh bị tắt. Ngưỡng mặc định là 60 giây; đặt `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.
- Với `openai/*`, chế độ nhanh ánh xạ tới xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với các mô hình `openai/*` / `openai-codex/*` dùng Codex hậu thuẫn, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. Các lượt máy chủ ứng dụng Codex gốc chỉ nhận tier trên `turn/start` hoặc bắt đầu/tiếp tục luồng, nên `auto` không thể đổi tier một lượt máy chủ ứng dụng đang chạy; nó áp dụng cho lượt mô hình tiếp theo mà OpenClaw bắt đầu.
- Với các yêu cầu công khai trực tiếp `anthropic/*`, bao gồm lưu lượng đã xác thực OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ tới các tầng dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Các tham số mô hình Anthropic `serviceTier` / `service_tier` rõ ràng ghi đè mặc định chế độ nhanh khi cả hai được đặt. OpenClaw vẫn bỏ qua việc chèn tầng dịch vụ Anthropic cho các URL cơ sở proxy không phải Anthropic.
- `/status` hiển thị `Fast` khi chế độ nhanh được bật và `Fast:auto` khi chế độ đã cấu hình là tự động.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị bật/tắt chi tiết phiên và trả lời `Verbose logging enabled.` / `Verbose logging disabled.`; các mức không hợp lệ trả về gợi ý mà không đổi trạng thái.
- `/verbose off` lưu một ghi đè phiên tắt rõ ràng; xóa nó qua UI Phiên bằng cách chọn `inherit`.
- Người gửi kênh bên ngoài được ủy quyền có thể lưu lâu dài ghi đè chi tiết của phiên. Các client gateway/webchat nội bộ cần `operator.admin` để lưu lâu dài.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các mặc định phiên/toàn cục được áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không có đối số để xem mức chi tiết hiện tại.
- Khi chi tiết được bật, các tác tử phát ra kết quả công cụ có cấu trúc sẽ gửi lại từng lệnh gọi công cụ dưới dạng một tin nhắn chỉ chứa metadata riêng, có tiền tố `<emoji> <tool-name>: <arg>` khi có. Các tóm tắt công cụ này được gửi ngay khi mỗi công cụ bắt đầu (bong bóng riêng), không phải dưới dạng delta phát trực tuyến.
- Tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng các hậu tố chi tiết lỗi thô bị ẩn trừ khi chi tiết là `full`.
- Khi chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng, được cắt ngắn đến độ dài an toàn). Nếu bạn bật/tắt `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo tuân theo cài đặt mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình dạng của tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến trình. Dùng `"explain"` (mặc định) cho nhãn ngắn gọn dễ đọc như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn nối thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo tác tử ghi đè mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Mức: `on` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị bật/tắt đầu ra truy vết Plugin của phiên và trả lời `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các mặc định phiên/toàn cục được áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không có đối số để xem mức truy vết hiện tại.
- `/trace` hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu như tóm tắt gỡ lỗi Active Memory.
- Các dòng truy vết có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi trợ lý bình thường.

## Hiển thị suy luận (/reasoning)

- Mức: `on|off|stream`.
- Tin nhắn chỉ chứa chỉ thị bật/tắt việc hiển thị các khối tư duy trong phản hồi.
- Khi bật, suy luận được gửi dưới dạng một **tin nhắn riêng** có tiền tố `Thinking`.
- `stream`: phát trực tuyến suy luận trong khi phản hồi đang được tạo khi kênh đang hoạt động hỗ trợ xem trước suy luận, rồi gửi câu trả lời cuối cùng không kèm suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không có đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, rồi ghi đè phiên, rồi mặc định theo tác tử (`agents.list[].reasoningDefault`), rồi mặc định toàn cục (`agents.defaults.reasoningDefault`), rồi dự phòng (`off`).

Các thẻ suy luận của mô hình cục bộ bị sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trong các phản hồi thông thường, và phần suy luận chưa đóng sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bao toàn bộ trong một thẻ mở chưa đóng duy nhất và nếu không sẽ được gửi dưới dạng văn bản rỗng, OpenClaw sẽ xóa thẻ mở sai định dạng đó và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu chế độ nâng quyền nằm trong [Chế độ nâng quyền](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là prompt heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong thông báo heartbeat vẫn áp dụng như thường lệ (nhưng tránh thay đổi mặc định phiên từ heartbeat).
- Việc gửi Heartbeat mặc định chỉ gửi payload cuối cùng. Để gửi thêm thông báo `Thinking` riêng biệt (khi có), đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc theo từng tác tử `agents.list[].heartbeat.includeReasoning: true`.

## Giao diện trò chuyện web

- Bộ chọn suy nghĩ của trò chuyện web phản ánh mức đã lưu của phiên từ kho/cấu hình phiên đến khi trang tải.
- Chọn một mức khác sẽ ghi phần ghi đè phiên ngay lập tức qua `sessions.patch`; thao tác này không chờ lần gửi tiếp theo và không phải là ghi đè một lần `thinkingOnce`.
- Tùy chọn đầu tiên luôn là lựa chọn xóa ghi đè. Nó hiển thị `Inherited: <resolved level>`, bao gồm `Inherited: Off` khi suy nghĩ kế thừa bị tắt.
- Các lựa chọn rõ ràng trong bộ chọn dùng nhãn mức trực tiếp của chúng, đồng thời giữ nguyên nhãn nhà cung cấp khi có (ví dụ `Maximum` cho tùy chọn `max` có nhãn từ nhà cung cấp).
- Bộ chọn dùng `thinkingLevels` do hàng phiên/default của Gateway trả về, còn `thinkingOptions` được giữ làm danh sách nhãn cũ. Giao diện trình duyệt không giữ danh sách regex nhà cung cấp riêng; plugin sở hữu các tập mức dành riêng cho mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nên chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Plugin nhà cung cấp có thể cung cấp `resolveThinkingProfile(ctx)` để định nghĩa các mức được mô hình hỗ trợ và mặc định.
- Plugin nhà cung cấp proxy mô hình Claude nên dùng lại `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để catalog Anthropic trực tiếp và catalog proxy luôn khớp nhau.
- Mỗi mức hồ sơ có một `id` chuẩn tắc đã lưu (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, hoặc `max`) và có thể bao gồm `label` hiển thị. Nhà cung cấp nhị phân dùng `{ id: "low", label: "on" }`.
- Hook hồ sơ nhận các dữ kiện catalog đã hợp nhất khi có, bao gồm `reasoning`, `compat.thinkingFormat`, và `compat.supportedReasoningEfforts`. Dùng các dữ kiện đó để chỉ hiển thị hồ sơ nhị phân hoặc tùy chỉnh khi hợp đồng yêu cầu đã cấu hình hỗ trợ payload tương ứng.
- Plugin công cụ cần xác thực một ghi đè suy nghĩ rõ ràng nên dùng `api.runtime.agent.resolveThinkingPolicy({ provider, model })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên giữ danh sách mức nhà cung cấp/mô hình riêng.
- Plugin công cụ có quyền truy cập metadata mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các opt-in `compat.supportedReasoningEfforts` được phản ánh trong xác thực phía plugin.
- Các hook cũ đã phát hành (`supportsXHighThinking`, `isBinaryThinking`, và `resolveDefaultThinkingLevel`) vẫn là adapter tương thích, nhưng các tập mức tùy chỉnh mới nên dùng `resolveThinkingProfile`.
- Hàng/default của Gateway hiển thị `thinkingLevels`, `thinkingOptions`, và `thinkingDefault` để client ACP/trò chuyện hiển thị cùng id và nhãn hồ sơ mà xác thực runtime sử dụng.
